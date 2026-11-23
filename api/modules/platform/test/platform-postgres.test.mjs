import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  IdempotencyKeyReuseError,
  IdempotencyService,
  OutboxRepository,
  PostgresSystemTransactionRunner,
  PostgresTransactionRunner,
  markEventProcessed,
} from '../../../dist/modules/platform/index.js';

const databaseUrl = process.env.CATARINA_TEST_PG_URL;
if (!databaseUrl) throw new Error('CATARINA_TEST_PG_URL must point to a disposable PostgreSQL 17 server with CREATEDB/CREATEROLE privileges');

const maintenanceUrl = new URL(databaseUrl);
maintenanceUrl.pathname = '/postgres';
const maintenancePool = new Pool({ connectionString: maintenanceUrl.toString(), max: 2 });
const databaseName = `wp15_test_${randomUUID().replaceAll('-', '')}`;
const roleName = `wp15_app_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const rolePassword = `${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}`;
let adminPool;
let appPool;
let singleConnectionPool;
let createdDatabase = false;
let createdRole = false;
const actor = { tenantId: randomUUID(), userId: randomUUID() };
const otherActor = { tenantId: randomUUID(), userId: randomUUID() };
let transactions;
let systemTransactions;
let idempotency;
let outbox;

before(async () => {
  await maintenancePool.query(`CREATE DATABASE ${databaseName}`);
  createdDatabase = true;
  await maintenancePool.query(`CREATE ROLE ${roleName} LOGIN PASSWORD '${rolePassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  createdRole = true;

  const testAdminUrl = new URL(databaseUrl);
  testAdminUrl.pathname = `/${databaseName}`;
  adminPool = new Pool({ connectionString: testAdminUrl.toString(), max: 4 });
  const appUrl = new URL(testAdminUrl.toString());
  appUrl.username = roleName;
  appUrl.password = rolePassword;
  appPool = new Pool({ connectionString: appUrl.toString(), max: 8 });
  singleConnectionPool = new Pool({ connectionString: appUrl.toString(), max: 1 });
  transactions = new PostgresTransactionRunner(appPool);
  systemTransactions = new PostgresSystemTransactionRunner(adminPool);
  idempotency = new IdempotencyService(transactions);
  outbox = new OutboxRepository(systemTransactions);

  const client = await adminPool.connect();
  try {
    const migration = await readFile(new URL('../migrations/001_platform_kernel.sql', import.meta.url), 'utf8');
    await client.query(migration);
    await client.query(`GRANT USAGE ON SCHEMA plt TO ${roleName}`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA plt TO ${roleName}`);
  } finally {
    client.release();
  }
});

after(async () => {
  try {
    await appPool?.end();
    await singleConnectionPool?.end();
    await adminPool?.end();
    if (createdDatabase) await maintenancePool.query(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
    if (createdRole) await maintenancePool.query(`DROP ROLE IF EXISTS ${roleName}`);
  } finally {
    await maintenancePool.end();
  }
});

async function asApp(actorContext, work) {
  return transactions.run(actorContext, work);
}

test('outbox append participates in its caller transaction and rolls back on failure', async () => {
  const eventId = randomUUID();
  await assert.rejects(asApp(actor, async (tx) => {
    await outbox.append(tx, {
      eventId,
      tenantId: actor.tenantId,
      eventType: 'PatchAccepted',
      schemaVersion: 1,
      payload: { patch_id: randomUUID() },
    });
    throw new Error('force rollback');
  }), /force rollback/);

  const result = await systemTransactions.run((tx) => tx.query('SELECT count(*)::int AS count FROM plt.outbox_event WHERE event_id = $1', [eventId]));
  assert.equal(result.rows[0].count, 0);
});

test('idempotency is isolated by tenant and replays one effect for concurrent clients', async () => {
  assert.throws(
    () => idempotency.execute({ actor, key: 'weak', scope: 'plans.accept_patch', requestBody: {}, effect: async () => ({ status: 200, body: {} }) }),
    /128 bits of entropy/,
  );
  const key = randomUUID();
  const eventId = randomUUID();
  const effect = async (tx) => {
    await outbox.append(tx, {
      eventId,
      tenantId: actor.tenantId,
      eventType: 'PatchAccepted',
      schemaVersion: 1,
      payload: { patch_id: randomUUID() },
    });
    return { status: 200, body: { accepted: true } };
  };
  const requests = await Promise.all([
    idempotency.execute({ actor, key, scope: 'plans.accept_patch', requestBody: { patch: 'one' }, effect }),
    idempotency.execute({ actor, key, scope: 'plans.accept_patch', requestBody: { patch: 'one' }, effect }),
  ]);
  assert.deepEqual(requests.map((response) => response.replayed).sort(), [false, true]);
  assert.deepEqual(requests[0].body, requests[1].body);

  const replay = await idempotency.execute({ actor, key, scope: 'plans.accept_patch', requestBody: { patch: 'one' }, effect });
  assert.equal(replay.replayed, true);
  await assert.rejects(
    idempotency.execute({ actor, key, scope: 'plans.accept_patch', requestBody: { patch: 'different' }, effect }),
    IdempotencyKeyReuseError,
  );
  await assert.rejects(
    idempotency.execute({ actor, key, scope: 'plans.approve', requestBody: { patch: 'one' }, effect }),
    IdempotencyKeyReuseError,
  );

  const eventCount = await systemTransactions.run((tx) => tx.query('SELECT count(*)::int AS count FROM plt.outbox_event WHERE event_id = $1', [eventId]));
  assert.equal(eventCount.rows[0].count, 1);

  let otherTenantEffectRan = false;
  const other = await idempotency.execute({
    actor: otherActor,
    key,
    scope: 'plans.accept_patch',
    requestBody: { patch: 'different' },
    effect: async () => { otherTenantEffectRan = true; return { status: 200, body: { accepted: true } }; },
  });
  assert.equal(otherTenantEffectRan, true);
  assert.equal(other.replayed, false);

  await assert.rejects(
    idempotency.execute({
      actor: { ...actor, userId: randomUUID() },
      key,
      scope: 'plans.accept_patch',
      requestBody: { patch: 'one' },
      effect,
    }),
    IdempotencyKeyReuseError,
  );
});

test('processed_event deduplicates effects and transaction-local identity never leaks to the next borrower', async () => {
  const eventId = randomUUID();
  let effects = 0;
  for (let index = 0; index < 2; index += 1) {
    await asApp(actor, async (tx) => {
      if (await markEventProcessed(tx, { tenantId: actor.tenantId, consumer: 'test-projector', eventId })) {
        effects += 1;
        await outbox.append(tx, {
          eventId: randomUUID(),
          tenantId: actor.tenantId,
          eventType: 'ProjectionChanged',
          schemaVersion: 1,
          payload: { source_event_id: eventId },
        });
      }
    });
  }
  assert.equal(effects, 1);

  const singleConnectionTransactions = new PostgresTransactionRunner(singleConnectionPool);
  const observed = await singleConnectionTransactions.runIdentityLookup(
    { tenantId: otherActor.tenantId, issuer: 'https://issuer.invalid', subject: 'synthetic-subject' },
    async (tx) => {
      const result = await tx.query(
        "SELECT current_setting('app.tenant_id', true) AS tenant, current_setting('app.oidc_issuer', true) AS issuer, current_setting('app.oidc_subject', true) AS subject",
      );
      return result.rows[0];
    },
  );
  assert.equal(observed.tenant, otherActor.tenantId);
  assert.equal(observed.issuer, 'https://issuer.invalid');
  assert.equal(observed.subject, 'synthetic-subject');

  const nextBorrower = await singleConnectionTransactions.run(actor, async (tx) => {
    const result = await tx.query(
      "SELECT nullif(current_setting('app.tenant_id', true), '') AS tenant, nullif(current_setting('app.oidc_subject', true), '') AS subject",
    );
    return result.rows[0];
  });
  assert.equal(nextBorrower.tenant, actor.tenantId);
  assert.equal(nextBorrower.subject, null);
});

test('RLS rejects cross-tenant outbox writes under an application role', async () => {
  await assert.rejects(asApp(actor, (tx) => outbox.append(tx, {
    eventId: randomUUID(),
    tenantId: otherActor.tenantId,
    eventType: 'PatchAccepted',
    schemaVersion: 1,
    payload: { patch_id: randomUUID() },
  })));
});


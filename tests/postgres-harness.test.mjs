import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createBarrier, psql, startPostgres, stopPostgres } from './support/postgres.mjs';

before(startPostgres);
after(stopPostgres);

test('uses the configured real PostgreSQL server', async () => {
  const version = await psql('SHOW server_version_num');
  assert.ok(Number(version) >= 170000 && Number(version) < 180000, `unexpected PostgreSQL version: ${version}`);
});

test('barrier releases independent database sessions together', async () => {
  // No temp table is created: every psql invocation is a separate process and
  // therefore a separate PostgreSQL session, so a TEMP table would not be
  // shared. Independence is proven directly by the distinct backend PIDs below.
  const wait = createBarrier(2);
  const sessions = [1, 2].map(async (id) => {
    await wait();
    // docker exec / a short-lived client container starts a separate psql
    // process and therefore a separate PostgreSQL session.
    return psql(`SELECT pg_backend_pid(), ${id}`);
  });
  const results = await Promise.all(sessions);
  const backendPids = results.map((result) => result.split('|')[0]);
  assert.equal(new Set(backendPids).size, 2, 'participants must use two independent PostgreSQL sessions');
  assert.deepEqual(results.map((result) => Number(result.split('|')[1])).sort(), [1, 2]);
});

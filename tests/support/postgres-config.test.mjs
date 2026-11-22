import test from 'node:test';
import assert from 'node:assert/strict';
import { POSTGRES_TARGET, POSTGRES_URL_ENV } from './postgres.mjs';

test('the harness targets a real PostgreSQL 17 server, never a mock', () => {
  assert.match(POSTGRES_TARGET.image, /^postgres:17/);
  assert.ok(['ci-service', 'managed-container'].includes(POSTGRES_TARGET.mode));
  assert.equal(POSTGRES_TARGET.urlEnv, POSTGRES_URL_ENV);
  assert.equal(POSTGRES_TARGET.image, 'postgres:17.5-alpine');
});

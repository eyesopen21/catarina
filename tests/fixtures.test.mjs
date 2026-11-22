import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPii, scanPaths as scanPii } from './security/pii-scan.mjs';
import { findSecrets, scanPaths as scanSecrets } from './security/secret-scan.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, 'fixtures');

test('all fixtures are free of PII and secrets', async () => {
  assert.deepEqual(await scanPii([fixtures]), []);
  assert.deepEqual(await scanSecrets([fixtures]), []);
});

test('synthetic log samples carry only opaque correlation identifiers', async () => {
  const sample = path.join(fixtures, 'logs', 'sample.jsonl');
  for (const line of (await readFile(sample, 'utf8')).split('\n').filter(Boolean)) {
    const event = JSON.parse(line);
    assert.deepEqual(Object.keys(event).sort(), [
      'actor_kind', 'event', 'level', 'result', 'tenant_id', 'trace_id',
    ].sort());
    assert.deepEqual(findPii(line), []);
    assert.deepEqual(findSecrets(line), []);
  }
});

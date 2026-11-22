import test from 'node:test';
import assert from 'node:assert/strict';
import { GITLEAKS_ARGS, GITLEAKS_COMMAND, isShallowRepository } from './gitleaks-history.mjs';

test('history scan uses git --all and redacts findings', () => {
  assert.equal(GITLEAKS_COMMAND, 'gitleaks');
  assert.deepEqual([...GITLEAKS_ARGS], ['git', '.', '--log-opts=--all', '--redact', '--exit-code', '1']);
});

test('this checkout is not shallow (full history available in CI with fetch-depth: 0)', () => {
  assert.equal(isShallowRepository(), false);
});

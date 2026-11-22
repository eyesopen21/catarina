import test from 'node:test';
import assert from 'node:assert/strict';
import { findPii, scanPaths } from './pii-scan.mjs';

test('scanner detects contact and national identifier canaries built in memory', () => {
  const syntheticEmail = ['alumna', 'canary.invalid'].join('@');
  const syntheticPhone = ['8888', '1111'].join(' ');
  const syntheticId = ['1', '2345', '6789'].join('-');
  assert.equal(findPii(`${syntheticEmail} ${syntheticPhone} ${syntheticId}`).length, 3);
});

test('repository, fixtures, and synthetic log samples contain no detected PII', async () => {
  const findings = await scanPaths();
  assert.deepEqual(findings, []);
});

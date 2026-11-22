import test from 'node:test';
import assert from 'node:assert/strict';
import { findPii, scanPaths } from './pii-scan.mjs';

// Canaries are assembled at runtime: no literal PII shape may live in the repo.
const phone = (a, b, separator = '-') => [a, b].join(separator);
const nationalId = (a, b, c) => [a, b, c].join('-');

test('scanner detects contact and national identifier canaries built in memory', () => {
  const syntheticEmail = ['alumna', 'canary.invalid'].join('@');
  const syntheticPhone = phone('8888', '1111', ' ');
  const syntheticId = nationalId('1', '2345', '6789');
  assert.equal(findPii(`${syntheticEmail} ${syntheticPhone} ${syntheticId}`).length, 3);
});

test('repository, fixtures, and synthetic log samples contain no detected PII', async () => {
  const findings = await scanPaths();
  assert.deepEqual(findings, []);
});

test('REGRESSION: digit runs embedded in hex hashes are not phone numbers', () => {
  const hash = 'sha256=deadbeef88881111cafebabe0123456789abcdef';
  assert.deepEqual(findPii(hash), []);
});

test('REGRESSION: every phone and national id in one file is reported', () => {
  const first = phone('8888', '1111');
  const second = phone('8888', '2222');
  const firstId = nationalId('1', '2345', '6789');
  const secondId = nationalId('2', '3456', '7890');
  const text = ['Llamar a', first, 'o', `${second}.`, 'Cedulas', firstId, 'y', `${secondId}.`].join(' ');
  const findings = findPii(text);
  assert.equal(findings.length, 4);
  const values = findings.map((finding) => finding.value);
  for (const expected of [first, second, firstId, secondId]) {
    assert.ok(values.includes(expected), `missing synthetic identifier: ${expected}`);
  }
});

test('a standalone synthetic phone number is still detected', () => {
  const synthetic = phone('8888', '1111', ' ');
  const findings = findPii(['telefono de prueba:', `${synthetic}.`].join(' '));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'phone');
  assert.equal(findings[0].value, synthetic);
});

test('the date guard remains active', () => {
  assert.deepEqual(findPii('periodo 2020-2021'), []);
});

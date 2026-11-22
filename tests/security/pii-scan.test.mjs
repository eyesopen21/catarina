import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { findPii, scanPaths } from './pii-scan.mjs';
import { scanPaths as scanSecrets } from './secret-scan.mjs';

// Canaries are assembled at runtime: no literal PII shape may live in the repo.
const phone = (a, b, separator = '-') => [a, b].join(separator);
const nationalId = (a, b, c) => [a, b, c].join('-');
// Every 8-digit segment is split so no phone-shaped literal exists in source.
const opaqueUuid = () => [['2000', '0000'].join(''), '0000', '4000', '8000', '000000000001'].join('-');

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

test('REGRESSION: two phone numbers in one text both reported (global iteration)', () => {
  const first = phone('8888', '1111', ' ');
  const second = phone('7777', '2222', ' ');
  const findings = findPii([first, 'and', second].join(' '));
  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map((finding) => finding.value), [first, second]);
});

test('REGRESSION: two national ids in one text both reported', () => {
  const first = nationalId('1', '2345', '6789');
  const second = nationalId('2', '3456', '7890');
  const findings = findPii([first, 'y', second].join(' '));
  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map((finding) => finding.value), [first, second]);
});

test('REGRESSION: reviewer-confirmed hash/timestamp/decimal false positives are ignored', () => {
  const samples = [
    '"graph_mtime_ns": 1795371744764283900',
    '"mtime": 1795371152.4883711',
    '_Cohesion score 0.06327006327006326',
    'sha256:21656087abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
    '9f8e2b601234567890abcdef0123456789abcdef',
  ];
  for (const sample of samples) assert.deepEqual(findPii(sample), []);
});

test('REGRESSION: a standalone 8-digit phone is detected (no coverage loss)', () => {
  // Assembled in memory so the repo scan does not flag this test itself.
  const standalone = ['6012', '3456'].join('');
  const findings = findPii(['numero', standalone, 'fin'].join(' '));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'phone');
  assert.equal(findings[0].value, standalone);
});

test('E.164/+506 numbers remain detected', () => {
  const findings = findPii(['Llamar al', ['+506', phone('8888', '1111', ' ')].join(' ')].join(' '));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].value, ['+506', phone('8888', '1111', ' ')].join(' '));
});

test('REGRESSION: an 8-digit segment inside a UUID is not a phone', () => {
  const uuid = opaqueUuid();
  const text = `curriculum_version_id: "${uuid}"`;
  assert.deepEqual(findPii(text), []);
});

test('REGRESSION: a phone next to a UUID is still detected', () => {
  const uuid = opaqueUuid();
  const nearby = phone('8888', '1111', ' ');
  const findings = findPii([uuid, nearby].join(' '));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].value, nearby);
});

test('REGRESSION: lockfile deprecated metadata email is ignored, nothing else is', () => {
  const email = ['i@', 'izs.me'].join('');
  const deprecated = `    deprecated: Support may be purchased by contacting ${email}`;
  assert.deepEqual(findPii(deprecated, 'pnpm-lock.yaml'), []);

  // Negative controls: the same address on another line of the same lockfile,
  // and on a deprecated line of a non-lockfile, MUST still be reported.
  assert.equal(findPii(`    resolved: ${email}`, 'pnpm-lock.yaml').length, 1);
  assert.equal(findPii(deprecated, 'README.md').length, 1);
});

test('REGRESSION: .html and .htm source artifacts are scanned by both scanners', async () => {
  const tempBase = path.join(os.tmpdir(), 'opencode');
  await mkdir(tempBase, { recursive: true });
  const dir = await mkdtemp(path.join(tempBase, 'wp03-html-'));
  try {
    const email = ['alumna', 'canary.invalid'].join('@');
    const phoneNumber = phone('8888', '1111', ' ');
    const token = ['gh', 'p_'].join('') + 'A'.repeat(36);
    const markup = `<!doctype html><p>${email} ${phoneNumber} ${token}</p>`;
    await writeFile(path.join(dir, 'index.html'), markup, 'utf8');
    await writeFile(path.join(dir, 'legacy.htm'), markup, 'utf8');

    const pii = await scanPaths([dir]);
    assert.deepEqual(pii.map((finding) => finding.kind).sort(), ['email', 'email', 'phone', 'phone']);

    const secrets = await scanSecrets([dir]);
    assert.deepEqual(secrets.map((finding) => finding.kind).sort(), ['github-token', 'github-token']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

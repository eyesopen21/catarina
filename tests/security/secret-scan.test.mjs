import test from 'node:test';
import assert from 'node:assert/strict';
import { findSecrets, scanPaths } from './secret-scan.mjs';

// Canaries are assembled in memory so no literal credential shape is committed.
const githubToken = 'gh' + 'p_' + 'A'.repeat(36);
const awsKey = 'AKIA' + 'B'.repeat(16);
const jsonWebToken = 'eyJ' + 'A'.repeat(10) + '.' + 'B'.repeat(10) + '.' + 'C'.repeat(10);
const privateKeyHeader = '-----BEGIN ' + 'RSA PRIVATE KEY' + '-----';
const keyName = ['api', '_key'].join('');
const secretValue = ['aB3d', 'E5gH', '7jK9', 'mN2p', 'Q4rS', '6tU8'].join('');
const assignedCredential = `${keyName} = "${secretValue}"`;

test('scanner detects provider keys, tokens, private headers and assigned credentials', () => {
  const text = [githubToken, awsKey, jsonWebToken, privateKeyHeader, assignedCredential].join('\n');
  const findings = findSecrets(text);
  assert.equal(findings.length, 5);
  assert.deepEqual(
    findings.map((finding) => finding.kind).sort(),
    ['assigned-credential', 'aws-access-key-id', 'github-token', 'jwt', 'private-key'].sort(),
  );
});

test('repository, fixtures and synthetic samples contain no secrets', async () => {
  const findings = await scanPaths();
  assert.deepEqual(findings, []);
});

test('REGRESSION: every occurrence of the same secret kind is reported', () => {
  const first = 'gh' + 'p_' + 'C'.repeat(36);
  const second = 'gh' + 'p_' + 'D'.repeat(36);
  const findings = findSecrets(`${first}\n${second}`);
  assert.equal(findings.length, 2);
  assert.ok(findings.every((finding) => finding.kind === 'github-token'));
});

test('documented placeholders and prose are not treated as secrets', () => {
  const text = [`${keyName} = "YOUR_API_KEY_HERE"`, 'password: "cambiar en produccion"'].join('\n');
  assert.deepEqual(findSecrets(text), []);
});

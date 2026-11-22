import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectMatches, repositoryRoot, walkTextFiles } from '../support/scan-util.mjs';

const root = repositoryRoot(import.meta.url);

// Assembled at runtime so the scanner never contains a literal secret header
// or credential shape that it would flag on itself.
const PRIVATE_KEY_PATTERN = new RegExp('-----BEGIN ' + '(?:[A-Z ]+ )?' + 'PRIVATE KEY' + '-----', 'g');

const ASSIGNED_CREDENTIAL_PATTERN = new RegExp(
  String.raw`\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|client[_-]?secret)\s*[:=]\s*(['"])([^'"\n]{12,})\1`,
  'g',
);

const detectors = [
  { id: 'aws-access-key-id', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g },
  { id: 'github-fine-grained-token', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/g },
  { id: 'gitlab-token', pattern: /\bglpat-[A-Za-z0-9_-]{20,}/g },
  { id: 'anthropic-key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { id: 'openai-key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
  { id: 'stripe-key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/g },
  { id: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'slack-token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { id: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { id: 'private-key', pattern: PRIVATE_KEY_PATTERN },
  { id: 'assigned-credential', pattern: ASSIGNED_CREDENTIAL_PATTERN },
];

const PLACEHOLDER = /^(?:changeme|change_me|example|placeholder|synthetic|fixture|todo|tbd|xxx+|<[^>]+>|\$\{[^}]+\}|your[_-].*|test[_-].*)$/i;

function isSecret(id, _value, match) {
  if (id === 'assigned-credential') {
    const credential = match[2];
    if (/\s/.test(credential) || PLACEHOLDER.test(credential)) return false;
    // A credential should mix character classes; prose words are not secrets.
    if (!/[0-9]/.test(credential) && !/[-_+/=]/.test(credential)) return false;
  }
  return true;
}

export function findSecrets(text) {
  return collectMatches(text, detectors, isSecret);
}

export async function scanPaths(paths = [root]) {
  const findings = [];
  for (const target of paths) {
    for await (const file of walkTextFiles(path.resolve(target))) {
      const content = await readFile(file, 'utf8');
      for (const match of findSecrets(content)) findings.push({ file: path.relative(root, file), ...match });
    }
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = process.argv.slice(2).map((entry) => path.resolve(process.cwd(), entry));
  const findings = await scanPaths(paths.length ? paths : [root]);
  if (findings.length) {
    for (const finding of findings) {
      console.error(`Secret candidate in ${finding.file}: ${finding.kind} (${finding.pattern})`);
    }
    process.exitCode = 1;
  } else {
    console.log('Secret scan passed.');
  }
}

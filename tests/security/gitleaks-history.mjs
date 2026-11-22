import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositoryRoot } from '../support/scan-util.mjs';

// SPR-03 requires the secret scan in CI AND over the repository history
// (docs/09 §8). secret-scan.mjs only covers the working tree; this wrapper is
// the history half. CI must check out with fetch-depth: 0 (AG-PLT owns the job).
export const GITLEAKS_COMMAND = 'gitleaks';
export const GITLEAKS_ARGS = Object.freeze([
  'git', '.', '--log-opts=--all', '--redact', '--exit-code', '1',
]);

export function isShallowRepository(root = repositoryRoot(import.meta.url)) {
  const result = spawnSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git rev-parse failed: ${result.stderr.trim()}`);
  return result.stdout.trim() === 'true';
}

export function runGitleaksHistory(root = repositoryRoot(import.meta.url)) {
  if (isShallowRepository(root)) {
    throw new Error('Shallow checkout: CI must use actions/checkout with fetch-depth: 0 to scan the full history');
  }
  const result = spawnSync(GITLEAKS_COMMAND, GITLEAKS_ARGS, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(runGitleaksHistory());
  } catch (error) {
    console.error(`Gitleaks history scan could not run: ${error.message}`);
    process.exit(1);
  }
}

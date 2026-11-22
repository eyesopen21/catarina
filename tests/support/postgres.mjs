import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export const POSTGRES_IMAGE = 'postgres:17.5-alpine';
export const POSTGRES_URL_ENV = 'CATARINA_TEST_PG_URL';
export const PSQL_BIN_ENV = 'CATARINA_TEST_PSQL';
const externalUrl = process.env[POSTGRES_URL_ENV] || '';
// Native psql client used when the URL points at an external real server.
// Defaults to `psql` on PATH; an absolute binary path can be supplied on hosts
// without a system-wide client (e.g. portable PostgreSQL binaries in temp).
const externalPsql = process.env[PSQL_BIN_ENV] || 'psql';

// Two ways to reach a REAL PostgreSQL 17 server: a container started by this
// harness (local Docker with a Linux daemon), or a server reached through a
// libpq URL using a native psql client. There is no mock, SQLite or in-memory
// fallback, and external mode never depends on Docker.
export const POSTGRES_TARGET = Object.freeze({
  mode: externalUrl ? 'ci-service' : 'managed-container',
  image: POSTGRES_IMAGE,
  urlEnv: POSTGRES_URL_ENV,
  psqlEnv: PSQL_BIN_ENV,
  managed: !externalUrl,
});

const containerName = `catarina-test-${randomUUID().slice(0, 8)}`;
let started = false;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${command} exited ${code}: ${stderr.trim()}`));
    });
  });
}

export async function startPostgres() {
  if (started) return;
  if (!externalUrl) {
    await run('docker', ['run', '--detach', '--rm', '--name', containerName,
      '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_HOST_AUTH_METHOD=trust',
      POSTGRES_IMAGE]);
  }
  started = true;

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      await psql('SELECT 1');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  await stopPostgres();
  const target = externalUrl ? `external server (${POSTGRES_URL_ENV})` : `container ${POSTGRES_IMAGE}`;
  throw new Error(`PostgreSQL ${target} did not become ready in 45 seconds`);
}

export async function psql(sql, { database = 'postgres' } = {}) {
  if (externalUrl) {
    // A native psql client connects straight to the real server (CI service
    // container or any reachable PostgreSQL 17 instance). Every invocation is
    // its own process and therefore its own PostgreSQL session, which is what
    // the distinct-pg_backend_pid() barrier assertion relies on.
    return run(externalPsql, ['-X', '--set', 'ON_ERROR_STOP=1', '--tuples-only',
      '--no-align', '--dbname', externalUrl, '--command', sql]);
  }
  return run('docker', ['exec', '--interactive', containerName, 'psql', '-X',
    '--set', 'ON_ERROR_STOP=1', '--tuples-only', '--no-align', '--username', 'postgres',
    '--dbname', database, '--command', sql]);
}

export async function stopPostgres() {
  if (!started) return;
  try {
    if (!externalUrl) await run('docker', ['stop', '--time', '3', containerName]);
  } finally {
    started = false;
  }
}

// Releases all parties only after every participant has arrived.
export function createBarrier(parties) {
  if (!Number.isInteger(parties) || parties < 1) throw new TypeError('parties must be a positive integer');
  let arrivals = 0;
  let release;
  const opened = new Promise((resolve) => { release = resolve; });
  return async function waitAtBarrier() {
    arrivals += 1;
    if (arrivals > parties) throw new Error('barrier received more arrivals than configured');
    if (arrivals === parties) release();
    await opened;
  };
}

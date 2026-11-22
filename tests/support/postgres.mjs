import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export const POSTGRES_IMAGE = 'postgres:17.5-alpine';
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
  await run('docker', ['run', '--detach', '--rm', '--name', containerName,
    '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_HOST_AUTH_METHOD=trust',
    POSTGRES_IMAGE]);
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
  throw new Error(`PostgreSQL container ${POSTGRES_IMAGE} did not become ready in 45 seconds`);
}

export async function psql(sql, { database = 'postgres' } = {}) {
  return run('docker', ['exec', '--interactive', containerName, 'psql', '-X',
    '--set', 'ON_ERROR_STOP=1', '--tuples-only', '--no-align', '--username', 'postgres',
    '--dbname', database, '--command', sql]);
}

export async function stopPostgres() {
  if (!started) return;
  try {
    await run('docker', ['stop', '--time', '3', containerName]);
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

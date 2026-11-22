import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectMatches, repositoryRoot, walkTextFiles } from '../support/scan-util.mjs';

const root = repositoryRoot(import.meta.url);

// Ranges are unchanged from the original detector. The `g` flag makes matchAll
// iterate every occurrence; token delimitation is applied in scan-util so hex
// hashes no longer produce false phone-positive findings.
const detectors = [
  { id: 'email', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { id: 'phone', pattern: /(?:\+?506[\s.-]?)?[2687]\d{3}[\s.-]?\d{4}/g },
  { id: 'national-id', pattern: /\b[1-9]-\d{4}-\d{4}\b/g },
];

const DATE_LIKE = /^20\d{2}[\s.-]20\d{2}$/;

// Token anchoring starts with isDelimited() in scan-util.mjs: digit runs
// embedded in hashes, timestamps or decimals are rejected there, while a
// standalone 8-digit phone remains fully detectable. Two narrow structural
// rules below handle opaque UUIDs and generated lockfile metadata.

// A UUID is an opaque identifier, not personal data. Its hyphen-separated hex
// segments can satisfy the phone/national-id shapes, so reject a candidate
// fully contained in a canonical 8-4-4-4-12 hex UUID.
const UUID_PATTERN = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

function isInsideUuid(text, start, end) {
  const from = Math.max(0, start - 40);
  const to = Math.min(text.length, end + 40);
  const window = text.slice(from, to);
  for (const uuid of window.matchAll(UUID_PATTERN)) {
    const uuidStart = from + uuid.index;
    if (start >= uuidStart && end <= uuidStart + uuid[0].length) return true;
  }
  return false;
}

// Generated dependency lockfiles carry npm `deprecated:` notices containing
// the upstream maintainer's contact address: third-party package metadata,
// not product PII. This exception is deliberately narrow - recognized
// lockfile basenames AND a line whose key is exactly `deprecated:`. Every
// other line of the same file, and every other file, is still fully scanned.
const LOCKFILE_NAMES = new Set([
  'pnpm-lock.yaml', 'package-lock.json', 'npm-shrinkwrap.json',
  'yarn.lock', 'poetry.lock', 'Pipfile.lock',
]);
const DEPRECATED_LINE = /^\s*["']?deprecated["']?\s*:/;

function isLockfileDeprecatedLine(filePath, line) {
  return Boolean(filePath) && LOCKFILE_NAMES.has(path.basename(filePath)) && DEPRECATED_LINE.test(line);
}

function isPiiCandidate(id, value, _match, context) {
  if (DATE_LIKE.test(value)) return false;
  if (isInsideUuid(context.text, context.start, context.end)) return false;
  if (id === 'email' && isLockfileDeprecatedLine(context.filePath, context.line)) return false;
  return true;
}

export function findPii(text, filePath = '') {
  return collectMatches(text, detectors, isPiiCandidate, filePath);
}

export async function scanPaths(paths = [root]) {
  const findings = [];
  for (const target of paths) {
    for await (const file of walkTextFiles(path.resolve(target))) {
      const content = await readFile(file, 'utf8');
      for (const match of findPii(content, file)) findings.push({ file: path.relative(root, file), ...match });
    }
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = process.argv.slice(2).map((entry) => path.resolve(process.cwd(), entry));
  const findings = await scanPaths(paths.length ? paths : [root]);
  if (findings.length) {
    for (const finding of findings) {
      console.error(`PII candidate in ${finding.file}: ${finding.kind} (${finding.pattern}) -> ${finding.value}`);
    }
    process.exitCode = 1;
  } else {
    console.log('PII scan passed.');
  }
}

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

// Principled token anchoring. A bare contiguous 8-digit run is ambiguous with
// identifiers, epoch fragments and counters (the graphify-out false positives),
// so it is only a phone candidate when it carries E.164/+506 or an explicit
// group separator. Embedded candidates are rejected by isDelimited() in
// scan-util.mjs. Neither rule narrows the numeric ranges of the detectors.
function isPiiCandidate(id, value) {
  if (DATE_LIKE.test(value)) return false;
  if (id !== 'phone') return true;
  const hasCountryCode = /^\+?506[\s.-]?/.test(value);
  const hasGroupSeparator = /[2687]\d{3}[\s.-]\d{4}/.test(value);
  return hasCountryCode || hasGroupSeparator;
}

export function findPii(text) {
  return collectMatches(text, detectors, isPiiCandidate);
}

export async function scanPaths(paths = [root]) {
  const findings = [];
  for (const target of paths) {
    for await (const file of walkTextFiles(path.resolve(target))) {
      const content = await readFile(file, 'utf8');
      for (const match of findPii(content)) findings.push({ file: path.relative(root, file), ...match });
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

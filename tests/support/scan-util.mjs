import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Shared walking / match hygiene for the PII and secret scanners.
// Generated and dependency metadata is excluded; source, docs, fixtures and
// synthetic log samples are always traversed.
export const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'target', '.codegraph']);

export const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.toml', '.csv', '.log',
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.rs', '.sql', '.env', '.sh', '.py',
]);

export function repositoryRoot(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), '../..');
}

export async function* walkTextFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) yield* walkTextFiles(path.join(directory, entry.name));
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      yield path.join(directory, entry.name);
    }
  }
}

// Rejects a match that is embedded in a longer alphanumeric token. This is the
// fix for the false positive where an 8-digit run inside a hex hash was read as
// a phone number. It does not narrow the numeric ranges of any detector.
const TOKEN_CHAR = /[A-Za-z0-9]/;

export function isDelimited(text, start, length) {
  const before = text[start - 1];
  const after = text[start + length];
  if (before && TOKEN_CHAR.test(before)) return false;
  if (after && TOKEN_CHAR.test(after)) return false;
  return true;
}

// Keeps the longest match when several detectors overlap the same span (e.g.
// the tail of a national id also looks like a local phone number). Every
// distinct occurrence is still reported; only duplicate spans are collapsed.
export function keepDistinctOccurrences(matches) {
  const ordered = [...matches].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const kept = [];
  for (const match of ordered) {
    if (kept.some((other) => match.start < other.end && other.start < match.end)) continue;
    kept.push(match);
  }
  return kept;
}

// Iterates EVERY occurrence of every global pattern. The previous implementation
// used pattern.exec() once per detector, hiding all matches after the first.
export function collectMatches(text, detectors, isCandidate = () => true) {
  const matches = [];
  for (const { id, pattern } of detectors) {
    for (const found of text.matchAll(pattern)) {
      if (!isDelimited(text, found.index, found[0].length)) continue;
      if (!isCandidate(id, found[0], found)) continue;
      matches.push({
        kind: id,
        pattern: pattern.source,
        value: found[0],
        start: found.index,
        end: found.index + found[0].length,
      });
    }
  }
  return keepDistinctOccurrences(matches).map(({ kind, pattern, value }) => ({ kind, pattern, value }));
}

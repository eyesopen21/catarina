import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skippedDirectories = new Set(['.git', 'node_modules', 'dist', 'target', '.codegraph']);
const textExtensions = new Set(['.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.toml', '.csv', '.log', '.ts', '.tsx', '.js', '.mjs', '.rs', '.sql', '.env']);
const contactPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+?506[\s.-]?)?[2687]\d{3}[\s.-]?\d{4}/,
  /\b[1-9]-\d{4}-\d{4}\b/,
];

async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !skippedDirectories.has(entry.name)) yield* files(path.join(directory, entry.name));
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) yield path.join(directory, entry.name);
  }
}

export function findPii(text) {
  return contactPatterns.flatMap((pattern) => {
    const match = pattern.exec(text);
    if (!match) return [];
    if (pattern === contactPatterns[1] && /^20\d{2}[\s.-]20\d{2}$/.test(match[0])) return [];
    return [{ pattern: pattern.source, value: match[0] }];
  });
}

export async function scanPaths(paths = [root]) {
  const findings = [];
  for (const target of paths) {
    const statFiles = await files(path.resolve(target));
    for await (const file of statFiles) {
      const matches = findPii(await readFile(file, 'utf8'));
      for (const match of matches) findings.push({ file: path.relative(root, file), ...match });
    }
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = process.argv.slice(2).map((entry) => path.resolve(process.cwd(), entry));
  const findings = await scanPaths(paths.length ? paths : [root]);
  if (findings.length) {
    for (const finding of findings) console.error(`PII candidate in ${finding.file} (${finding.pattern})`);
    process.exitCode = 1;
  } else {
    console.log('PII scan passed.');
  }
}

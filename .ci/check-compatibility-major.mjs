// Control for the OpenAPI compatibility comparator used by the `contracts` job.
// The comparator (`packages/contracts` check:compatibility) runs Redocly diff
// with --fail-on=major against BASE_REF. A non-zero exit alone is ambiguous:
// a missing ref or broken CLI configuration also exits non-zero. This probe
// proves the comparator reports a MAJOR change on a known breaking pair and
// passes on an identical pair, so a red job is attributable to `major`.
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const redoclyCli = path.join(root, "packages", "contracts", "node_modules", "@redocly", "cli", "bin", "cli.js");

// Copies of the WP-02 fixtures used by test/compatibility-diff.test.mjs.
const baseSpec = `openapi: 3.1.0
info:
  title: Compatibility fixture
  version: 1.0.0
paths:
  /health:
    get:
      operationId: getHealth
      responses:
        '200':
          description: Healthy
`;
const breakingSpec = `openapi: 3.1.0
info:
  title: Compatibility fixture
  version: 1.0.0
paths: {}
`;

const CONFIG_ERROR = /does not exist or is invalid|please provide a valid path|ENOENT|cannot find module|invalid config|command not found|no such file/i;

function diff(from, to) {
  return spawnSync(process.execPath, [
    redoclyCli, "diff", "--extends=diff-recommended", "--fail-on=major", from, to
  ], { cwd: root, encoding: "utf8" });
}

function output(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

const work = await mkdtemp(path.join(tmpdir(), "catarina-compat-probe-"));
try {
  const basePath = path.join(work, "openapi-base.yaml");
  const breakingPath = path.join(work, "openapi-breaking.yaml");
  await writeFile(basePath, baseSpec, "utf8");
  await writeFile(breakingPath, breakingSpec, "utf8");

  const control = diff(basePath, basePath);
  if (control.status !== 0) {
    throw new Error(`Comparator control failed (exit ${control.status}) on identical specs — configuration error, not a major change.\n${output(control)}`);
  }

  const breaking = diff(basePath, breakingPath);
  const detail = output(breaking);
  if (breaking.status === 0) {
    throw new Error(`Comparator accepted a removed operation — --fail-on=major is not active.\n${detail}`);
  }
  if (!/\bmajor\b/i.test(detail)) {
    throw new Error(`Comparator failed (exit ${breaking.status}) without reporting "major" — cannot attribute the failure to a breaking change.\n${detail}`);
  }
  if (CONFIG_ERROR.test(detail)) {
    throw new Error(`Comparator failure includes a configuration error signature.\n${detail}`);
  }

  console.log("Comparator control passed: identical specs exit 0, removed operation exits " +
    `${breaking.status} with a major-change verdict (no configuration error).`);
} finally {
  await rm(work, { recursive: true, force: true });
}

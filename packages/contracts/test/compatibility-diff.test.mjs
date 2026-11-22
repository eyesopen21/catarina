import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(packageRoot, "node_modules", "@redocly", "cli", "bin", "cli.js");
const basePath = path.join(packageRoot, "test", "fixtures", "openapi-base.yaml");
const breakingPath = path.join(packageRoot, "test", "fixtures", "openapi-breaking.yaml");
const compatiblePath = path.join(packageRoot, "test", "fixtures", "openapi-compatible.yaml");

const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, "");

function diff(base, candidate) {
  try {
    const stdout = execFileSync(process.execPath, [cliPath, "diff", "--extends=diff-recommended", "--fail-on=major", base, candidate], {
      cwd: packageRoot,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
    });
    return { status: 0, output: stripAnsi(stdout) };
  } catch (error) {
    return {
      status: typeof error.status === "number" ? error.status : 1,
      output: stripAnsi(`${error.stdout ?? ""}${error.stderr ?? ""}`)
    };
  }
}

test("Redocly CLI is installed and blocks a removed operation", () => {
  assert.equal(existsSync(cliPath), true, "Redocly CLI must be installed for CI compatibility checks");
  const result = diff(basePath, breakingPath);
  assert.notEqual(result.status, 0, "removing a published operation must fail the compatibility check");
  // Redocly imprime "1 major, 0 minor, 0 patch" y "Diff failed with 1 major change" con --fail-on=major.
  assert.match(result.output, /1 major,\s*0 minor,\s*0 patch/, "the failure must be classified as major by diff-recommended");
  assert.match(result.output, /Diff failed with 1 major change/, "Redocly must attribute the failure to a major change");
});

test("Redocly CLI accepts a backwards-compatible addition", () => {
  const result = diff(basePath, compatiblePath);
  assert.equal(result.status, 0, `a compatible addition must pass: ${result.output}`);
  assert.match(result.output, /0 major,\s*1 minor/, "diff-recommended must classify the addition as compatible (minor, not major)");
});

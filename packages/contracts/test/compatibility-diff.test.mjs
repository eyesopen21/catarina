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

test("Redocly CLI is installed and blocks a removed operation", () => {
  assert.equal(existsSync(cliPath), true, "Redocly CLI must be installed for CI compatibility checks");
  let rejected = false;
  try {
    execFileSync(process.execPath, [cliPath, "diff", "--fail-on=major", basePath, breakingPath], {
      cwd: packageRoot,
      stdio: "pipe",
      encoding: "utf8"
    });
  } catch (error) {
    rejected = typeof error.status === "number" && error.status !== 0;
  }
  assert.equal(rejected, true, "removing a published operation must fail the compatibility check");
});

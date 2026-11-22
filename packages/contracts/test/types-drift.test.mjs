import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(packageRoot, "node_modules", "openapi-typescript", "bin", "cli.js");
const specPath = path.resolve(packageRoot, "../../docs/contracts/openapi.yaml");
const committedPath = path.join(packageRoot, "src/generated/openapi.d.ts");
const normalize = (text) => text.replace(/\r\n/g, "\n");

test("generated TypeScript types are in sync with openapi.yaml", (t) => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "catarina-types-"));
  t.after(() => rmSync(tempDir, { recursive: true, force: true }));
  const generatedPath = path.join(tempDir, "openapi.d.ts");
  execFileSync(process.execPath, [cliPath, specPath, "-o", generatedPath], {
    cwd: packageRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const generated = normalize(readFileSync(generatedPath, "utf8"));
  const committed = normalize(readFileSync(committedPath, "utf8"));
  assert.match(generated, /Deprecation: string/, "Deprecation header must be present in generated types");
  assert.match(generated, /Sunset: string/, "Sunset header must be present in generated types");
  assert.equal(
    committed,
    generated,
    "src/generated/openapi.d.ts is stale: regenerate with `openapi-typescript ../../docs/contracts/openapi.yaml -o src/generated/openapi.d.ts`"
  );
});

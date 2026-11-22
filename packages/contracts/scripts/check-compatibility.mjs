import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const openApiPath = "docs/contracts/openapi.yaml";
const baseRef = process.env.BASE_REF ?? "origin/main";
const redoclyCli = path.join(packageRoot, "node_modules", "@redocly", "cli", "bin", "cli.js");

try {
  execFileSync(process.execPath, [
    redoclyCli, "diff", "--extends=diff-recommended", "--fail-on=major",
    `${baseRef}:${openApiPath}`,
    openApiPath
  ], { cwd: repoRoot, stdio: "inherit" });
} catch (error) {
  process.stderr.write(`OpenAPI compatibility diff failed (${error.message}). Review the change; incompatible v1 changes require /v2 and human approval.\n`);
  process.exit(typeof error.status === "number" ? error.status : 1);
}

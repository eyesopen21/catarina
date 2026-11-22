import { spawnSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = path.join(root, "api", "modules");
const curriculumIndex = path.join(modules, "curriculum", "index.ts");
const originalCurriculum = await readFile(curriculumIndex, "utf8");
const contexts = ["iam", "curriculum", "planning", "documents", "memory", "ai", "agents"];
const allModules = ["platform", ...contexts];
const matrix = {
  iam: [],
  curriculum: ["iam"],
  documents: ["iam"],
  planning: ["iam", "curriculum", "documents", "memory"],
  memory: ["iam", "curriculum"],
  ai: ["iam", "curriculum", "planning", "memory"],
  agents: ["iam", "curriculum", "planning", "memory", "ai"],
};
const fixtures = allModules.map((name) => path.join(modules, name, "architecture-fitness.ts"));

function cruise() {
  return spawnSync(process.execPath, [path.join(root, "node_modules", "dependency-cruiser", "bin", "dependency-cruiser.mjs"), "api/modules", "--config", ".dependency-cruiser.cjs", "--output-type", "err-long"], {
    cwd: root,
    encoding: "utf8",
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function assertExit(label, result, expectedFailure, expectedRule) {
  const failed = result.status !== 0;
  if (failed !== expectedFailure) {
    throw new Error(`${label}: expected ${expectedFailure ? "failure" : "success"}, got ${result.status}\n${output(result)}`);
  }
  if (expectedRule && !output(result).includes(expectedRule)) {
    throw new Error(`${label}: failed without the expected architecture rule ${expectedRule}\n${output(result)}`);
  }
}

try {
  for (const from of allModules) {
    const imports = allModules.map((to) => `import '../${to}';`).join("\n");
    await writeFile(path.join(modules, from, "architecture-fitness.ts"), imports);
  }

  const matrixResult = cruise();
  assertExit("complete module dependency matrix", matrixResult, true);
  const matrixOutput = output(matrixResult);
  for (const from of allModules) {
    for (const to of allModules) {
      const isAllowed = from === to || to === "platform" || (from !== "platform" && matrix[from].includes(to));
      const pair = `api/modules/${from}/architecture-fitness.ts → api/modules/${to}/index.ts`;
      if (matrixOutput.includes(pair) === isAllowed) {
        throw new Error(`matrix ${from} -> ${to}: expected ${isAllowed ? "no violation" : "a violation"}\n${matrixOutput}`);
      }
    }
  }
  await Promise.all(fixtures.map((fixture) => rm(fixture, { force: true })));

  const fixture = path.join(modules, "planning", "architecture-fitness.ts");
  await writeFile(fixture, "import type { Marker } from '../curriculum';\nvoid ({} as Marker);\n");
  assertExit("allowed planning -> curriculum type import", cruise(), false);

  const bannedVariants = [
    ["static relative import", "import { Marker } from '../ai';\nvoid Marker;\n"],
    ["type-only import", "import type { Marker } from '../ai';\nvoid ({} as Marker);\n"],
    ["re-export", "export { Marker } from '../ai';\n"],
    ["dynamic import", "void import('../ai');\n"],
    ["CommonJS require", "const ai = require('../ai');\nvoid ai;\n"],
    ["tsconfig path alias", "import { Marker } from '@modules/ai';\nvoid Marker;\n"],
  ];
  for (const [label, source] of bannedVariants) {
    await writeFile(fixture, source);
    assertExit(`forbidden ${label}`, cruise(), true, "context-planning-cannot-import");
  }

  await writeFile(fixture, "import type { Marker } from '../curriculum';\nvoid ({} as Marker);\n");
  await writeFile(curriculumIndex, `${originalCurriculum}\nimport '../planning/architecture-fitness';\n`);
  assertExit("circular dependency", cruise(), true, "no-cycles-between-modules");
  console.log("TC-NFR-MNT-01 passed: full matrix, permitted imports, import variants, and cycles verified.");
} finally {
  await Promise.all(fixtures.map((fixture) => rm(fixture, { force: true })));
  await writeFile(curriculumIndex, originalCurriculum);
}

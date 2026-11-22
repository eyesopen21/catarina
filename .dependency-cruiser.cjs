const contexts = ["iam", "curriculum", "planning", "documents", "memory", "ai", "agents"];
const allowed = {
  iam: [],
  curriculum: ["iam"],
  documents: ["iam"],
  planning: ["iam", "curriculum", "documents", "memory"],
  memory: ["iam", "curriculum"],
  ai: ["iam", "curriculum", "planning", "memory"],
  agents: ["iam", "curriculum", "planning", "memory", "ai"],
};

const crossContextRules = contexts.flatMap((from) => {
  const forbidden = contexts.filter((to) => from !== to && !allowed[from].includes(to));
  if (forbidden.length === 0) return [];
  return [{
    name: `context-${from}-cannot-import-${forbidden.join("-")}`,
    severity: "error",
    comment: `Enforces the caller row for ${from} in docs/04 §5.2.`,
    from: { path: `^api/modules/${from}/` },
    to: { path: `^api/modules/(?:${forbidden.join("|")})(?:/|$)` },
  }];
});

module.exports = {
  forbidden: [
    ...crossContextRules,
    {
      name: "platform-is-a-leaf-context",
      severity: "error",
      comment: "The shared platform kernel does not depend on bounded contexts.",
      from: { path: "^api/modules/platform/" },
      to: { path: "^api/modules/(?:iam|curriculum|planning|documents|memory|ai|agents)(?:/|$)" },
    },
    {
      name: "no-cycles-between-modules",
      severity: "error",
      comment: "docs/04 §5.2 explicitly prohibits dependency cycles.",
      from: { path: "^api/modules/" },
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.base.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)dist/" },
    enhancedResolveOptions: { extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] },
  },
};

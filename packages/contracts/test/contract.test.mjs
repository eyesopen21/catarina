import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const contractsRoot = path.resolve(import.meta.dirname, "../../../docs/contracts");
const openapi = parse(await readFile(path.join(contractsRoot, "openapi.yaml"), "utf8"));
const problemSchema = JSON.parse(await readFile(path.join(contractsRoot, "schemas/problem-details.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateProblem = ajv.compile(problemSchema);

test("OpenAPI contract is v1 and every error response uses RFC 9457", () => {
  assert.equal(openapi.openapi, "3.1.0");
  assert.match(openapi.info.version, /^1\./, "the published contract version must be 1.x");
  assert.ok(openapi.servers.some(({ url }) => new URL(url).pathname === "/v1"));
  assert.match(openapi.info.description, /MUST ignorar campos y\s+valores de enum desconocidos/i);
  assert.ok(openapi.components.headers.Deprecation);
  assert.ok(openapi.components.headers.Sunset);

  const violations = [];
  for (const [route, pathItem] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!["get", "post", "put", "patch", "delete", "options", "head", "trace"].includes(method)) continue;
      for (const [status, response] of Object.entries(operation.responses ?? {})) {
        if (!(status === "default" || /^[45]/.test(status))) continue;
        if (response.$ref) {
          const name = response.$ref.split("/").at(-1);
          const referenced = openapi.components.responses[name];
          assert.ok(referenced, `${method.toUpperCase()} ${route} references a missing response ${response.$ref}`);
          response.content = referenced.content;
        }
        const media = response.content?.["application/problem+json"];
        if (!media || media.schema?.$ref !== "./schemas/problem-details.schema.json") {
          violations.push(`${method.toUpperCase()} ${route} ${status} must reference ProblemDetails`);
        }
      }
    }
  }
  assert.deepEqual(violations, []);
});

test("ProblemDetails schema validates representative client and server errors", () => {
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    const body = {
      type: `https://api.example.invalid/problems/http-${status}`,
      title: "Solicitud no válida",
      status,
      code: "validation-failed"
    };
    assert.equal(validateProblem(body), true, JSON.stringify(validateProblem.errors));
  }
});

test("all published JSON Schema documents compile as draft 2020-12", async () => {
  const schemaAjv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(schemaAjv);
  const schemaDirectory = path.join(contractsRoot, "schemas");
  const schemaFiles = (await readdir(schemaDirectory)).filter((file) => file.endsWith(".schema.json"));
  const documents = await Promise.all(schemaFiles.map(async (file) => ({
    file,
    schema: JSON.parse(await readFile(path.join(schemaDirectory, file), "utf8"))
  })));
  for (const { schema } of documents) schemaAjv.addSchema(schema);
  for (const { file, schema } of documents) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema", `${file} declares JSON Schema 2020-12`);
    assert.doesNotThrow(() => schemaAjv.compile(schema), `${file} and its references compile`);
  }
});

test("pagination contract declares a 100 item ceiling and cursor page shape", () => {
  const limit = openapi.components.parameters.Limit;
  assert.equal(limit.schema.maximum, 100);
  assert.equal(limit.schema.default, 25);
  const cursor = openapi.components.parameters.Cursor;
  assert.match(cursor.description, /\(created_at, id\)/, "stable ordering must be declared (05 §8)");
  assert.match(cursor.description, /inserciones/, "cursor stability across insertions must be declared");
  assert.match(cursor.description, /422/, "undeclared query parameters must be declared as rejected");

  let pagedOperations = 0;
  for (const pathItem of Object.values(openapi.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== "object" || !Array.isArray(operation.parameters)) continue;
      const refs = operation.parameters.map((parameter) => parameter.$ref);
      if (refs.includes("#/components/parameters/Limit")) {
        assert.ok(refs.includes("#/components/parameters/Cursor"), `${operation.operationId} must pair Limit with Cursor`);
        pagedOperations++;
      }
    }
  }
  assert.ok(pagedOperations > 0, "at least one operation must expose the cursor");
  const pagedSchemas = Object.values(openapi.components.schemas).filter((schema) =>
    schema.type === "object" && schema.properties?.items && schema.properties?.next_cursor
  );
  assert.ok(pagedSchemas.length > 0, "at least one paged collection response must declare items and next_cursor");
  for (const schema of pagedSchemas) {
    assert.equal(schema.properties.next_cursor.type.includes("null"), true);
  }
});

test("FR-CUR-02 curriculum rules require the class and exceptions", () => {
  const ruleAjv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ruleAjv);
  const schema = JSON.parse(readFileSync(path.join(contractsRoot, "schemas/curriculum-rule.schema.json"), "utf8"));
  const validate = ruleAjv.compile(schema);
  const rule = {
    id: "40000000-0000-4000-8000-000000000001",
    curriculum_version_id: "20000000-0000-4000-8000-000000000001",
    source_id: "50000000-0000-4000-8000-000000000001",
    source_version: "2026-I",
    source_section: "Anexo 3",
    effective_from: "2026-01-01",
    education_level: "I_ciclo",
    modality: "presencial",
    subject: "matematica",
    rule_type: "structure",
    rule_class: "required_by_MEP",
    severity: "error",
    validator: { validator_id: "structure.sections", params: {} },
    human_explanation: "Regla sintética de ejemplo",
    exceptions: [],
    validation_status: "unvalidated"
  };
  assert.equal(validate(rule), true, JSON.stringify(validate.errors));
  for (const missing of ["exceptions", "rule_class", "human_explanation"]) {
    const incomplete = { ...rule };
    delete incomplete[missing];
    assert.equal(validate(incomplete), false, `${missing} must be required (FR-CUR-02)`);
    assert.ok(validate.errors.some((error) => error.keyword === "required" && error.params.missingProperty === missing));
  }
});

test("error type URIs are stable by code and deprecation policy is documented", async () => {
  assert.match(problemSchema["x-type-uri-template"], /\/\{code\}$/, "type URI must be derived from a stable code");
  assert.equal(problemSchema.properties.code.enum.length, new Set(problemSchema.properties.code.enum).size);
  assert.ok(openapi.components.headers.Deprecation && openapi.components.headers.Sunset);
  const changelog = await readFile(path.join(contractsRoot, "CHANGELOG.md"), "utf8");
  assert.match(changelog, /Deprecation/);
  assert.match(changelog, /Sunset/);
  assert.match(changelog, /seis meses|6 meses/, "deprecation notice must state the (>= six months, provisional) window");
  assert.match(changelog, /Proposed/, "contracts must remain Proposed until the human gate");
});

test("published Problem examples validate against the problem schema", () => {
  const examples = openapi.components.responses.Problem.content["application/problem+json"].examples;
  assert.ok(examples && Object.keys(examples).length >= 3, "Problem response must publish concrete examples");
  let validated = 0;
  for (const example of Object.values(examples)) {
    const body = example.value;
    assert.equal(validateProblem(body), true, `${example.summary}: ${JSON.stringify(validateProblem.errors)}`);
    assert.equal(body.type, `https://api.example.invalid/problems/${body.code}`, "type suffix must be the stable code");
    validated++;
  }
  assert.equal(validated, Object.keys(examples).length);
  assert.equal(validateProblem({
    type: "not-a-stable-uri",
    title: "Solicitud no válida",
    status: 422,
    code: "validation-failed"
  }), false, "an unstable type URI must be rejected by the schema");
});

import assert from "node:assert/strict";
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
  const pagedSchemas = Object.values(openapi.components.schemas).filter((schema) =>
    schema.type === "object" && schema.properties?.items && schema.properties?.next_cursor
  );
  assert.ok(pagedSchemas.length > 0, "at least one paged collection response must declare items and next_cursor");
  for (const schema of pagedSchemas) {
    assert.equal(schema.properties.next_cursor.type.includes("null"), true);
  }
});

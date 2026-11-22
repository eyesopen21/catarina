import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";

test("mock cursor continues the original snapshot after an insertion", async (t) => {
  const serverPath = path.resolve(import.meta.dirname, "../src/mock-server.mjs");
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => child.kill());

  let startupOutput = "";
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Mock did not start: ${startupOutput}`)), 5000);
    child.stdout.on("data", (chunk) => {
      startupOutput += chunk.toString();
      const match = startupOutput.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Mock exited early (${code}): ${startupOutput}`)));
  });
  const baseUrl = await ready;
  const firstResponse = await fetch(`${baseUrl}/v1/plans?limit=2`);
  assert.equal(firstResponse.status, 200);
  const firstPage = await firstResponse.json();
  assert.deepEqual(firstPage.items.map(({ title }) => title), ["Plan sintético A", "Plan sintético B"]);
  assert.equal(typeof firstPage.next_cursor, "string");

  const inserted = await fetch(`${baseUrl}/__mock/insert`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "00000000-0000-4000-8000-000000000004",
      created_at: "2026-01-01T10:30:00.000Z",
      title: "Plan sintético insertado"
    })
  });
  assert.equal(inserted.status, 201);

  const secondResponse = await fetch(`${baseUrl}/v1/plans?limit=2&cursor=${encodeURIComponent(firstPage.next_cursor)}`);
  assert.equal(secondResponse.status, 200);
  const secondPage = await secondResponse.json();
  assert.deepEqual(secondPage.items.map(({ title }) => title), ["Plan sintético C"]);
  assert.equal(secondPage.next_cursor, null);
  assert.ok(!secondPage.items.some(({ id }) => firstPage.items.some((first) => first.id === id)));
});

test("mock rejects a page size above the documented maximum", async (t) => {
  const serverPath = path.resolve(import.meta.dirname, "../src/mock-server.mjs");
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => child.kill());

  let output = "";
  const baseUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Mock did not start: ${output}`)), 5000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Mock exited early (${code}): ${output}`)));
  });
  const response = await fetch(`${baseUrl}/v1/plans?limit=101`);
  assert.equal(response.status, 422);
  assert.equal(response.headers.get("content-type"), "application/problem+json");
  const problem = await response.json();
  assert.equal(problem.status, 422);
  assert.equal(problem.code, "validation-failed");
  assert.equal(problem.type, "https://api.example.invalid/problems/validation-failed");
});

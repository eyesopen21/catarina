import { createServer } from "node:http";

const plans = [
  { id: "00000000-0000-4000-8000-000000000001", created_at: "2026-01-01T09:00:00.000Z", title: "Plan sintético A", sequence: 1 },
  { id: "00000000-0000-4000-8000-000000000002", created_at: "2026-01-01T10:00:00.000Z", title: "Plan sintético B", sequence: 2 },
  { id: "00000000-0000-4000-8000-000000000003", created_at: "2026-01-01T11:00:00.000Z", title: "Plan sintético C", sequence: 3 }
];
let nextSequence = 4;
const groupId = "10000000-0000-4000-8000-000000000001";
const curriculumVersionId = "20000000-0000-4000-8000-000000000001";
const templateId = "30000000-0000-4000-8000-000000000001";

const compare = (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
const problem = (status, code, title) => ({
  type: `https://api.example.invalid/problems/${code}`,
  title,
  status,
  code
});

function handler(request, response) {
  const url = new URL(request.url, "http://127.0.0.1");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.method === "POST" && url.pathname === "/__mock/insert") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        const plan = JSON.parse(body);
        if (!plan.id || !plan.created_at || !plan.title) throw new Error("Missing fields");
        plans.push({ ...plan, sequence: nextSequence++ });
        response.writeHead(201).end(JSON.stringify({ inserted: true }));
      } catch {
        response.writeHead(400, { "Content-Type": "application/problem+json" })
          .end(JSON.stringify(problem(400, "validation-failed", "Invalid synthetic fixture")));
      }
    });
    return;
  }

  if (request.method !== "GET" || url.pathname !== "/v1/plans") {
    response.writeHead(404, { "Content-Type": "application/problem+json" })
      .end(JSON.stringify(problem(404, "not-found", "Resource not found")));
    return;
  }

  const limit = Number(url.searchParams.get("limit") ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    response.writeHead(422, { "Content-Type": "application/problem+json" })
      .end(JSON.stringify(problem(422, "validation-failed", "limit must be between 1 and 100")));
    return;
  }

  try {
    const sorted = [...plans].sort(compare);
    const cursor = url.searchParams.get("cursor");
    const state = cursor ? decode(cursor) : null;
    const snapshotSequence = state?.snapshotSequence ?? nextSequence - 1;
    const eligible = sorted.filter((plan) =>
      plan.sequence <= snapshotSequence && (!state || compare(plan, state.last) > 0)
    );
    const items = eligible.slice(0, limit);
    const hasMore = eligible.length > items.length;
    const nextCursor = hasMore && items.length
      ? encode({ last: { created_at: items.at(-1).created_at, id: items.at(-1).id }, snapshotSequence })
      : null;
    response.writeHead(200).end(JSON.stringify({
      items: items.map(({ id, created_at, title }) => ({
        id,
        created_at,
        group_id: groupId,
        subject: "matematica",
        period: "2026-I",
        title,
        curriculum_version_id: curriculumVersionId,
        template_id: templateId,
        state: "draft",
        visibility: "private",
        row_version: 1
      })),
      next_cursor: nextCursor
    }));
  } catch {
    response.writeHead(422, { "Content-Type": "application/problem+json" })
      .end(JSON.stringify(problem(422, "validation-failed", "Invalid cursor")));
  }
}

const server = createServer(handler);
const port = Number(process.env.PORT ?? 4010);
server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  process.stdout.write(`Synthetic contracts mock listening at http://127.0.0.1:${address.port}\n`);
});

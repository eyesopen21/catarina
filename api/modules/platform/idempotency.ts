import { createHash } from "node:crypto";
import type { TransactionContext, TransactionRunner, VerifiedActor } from "./index";

export interface IdempotentResponse<T = unknown> {
  status: number;
  body: T;
  replayed: boolean;
}

export class IdempotencyKeyReuseError extends Error {
  readonly status = 422;
  readonly code = "idempotency-key-reuse";

  constructor() {
    super("Idempotency-Key was already used with a different request body");
    this.name = "IdempotencyKeyReuseError";
  }
}

type SavedResponse<T = unknown> = { status: number; body: T };
type IdempotencyRow = { request_hash: string; status: string; response: SavedResponse | null };

export class IdempotencyService {
  constructor(private readonly transactions: TransactionRunner) {}

  execute<T>(input: {
    actor: VerifiedActor;
    key: string;
    scope: string;
    requestBody: unknown;
    effect: (tx: TransactionContext) => Promise<SavedResponse<T>>;
  }): Promise<IdempotentResponse<T>> {
    if (!isAcceptableKey(input.key)) {
      throw new TypeError("Idempotency-Key must be a UUID or a random value with at least 128 bits of entropy");
    }
    if (!input.scope || input.scope.length > 255) throw new TypeError("Idempotency scope must contain 1 to 255 characters");
    const requestHash = hashRequest({ actorId: input.actor.userId, scope: input.scope, body: input.requestBody });
    return this.transactions.run(input.actor, async (tx) => {
      await tx.query(
        "DELETE FROM plt.idempotency_key WHERE tenant_id = $1 AND key = $2 AND expires_at <= now()",
        [input.actor.tenantId, input.key],
      );
      const insert = await tx.query(
        `INSERT INTO plt.idempotency_key (tenant_id, key, request_hash, status, expires_at)
         VALUES ($1, $2, $3, 'in_progress', now() + interval '24 hours')
         ON CONFLICT (tenant_id, key) DO NOTHING`,
        [input.actor.tenantId, input.key, requestHash],
      );

      if (insert.rowCount === 0) {
        const existing = await tx.query<IdempotencyRow>(
          `SELECT request_hash, status, response FROM plt.idempotency_key
            WHERE tenant_id = $1 AND key = $2 FOR UPDATE`,
          [input.actor.tenantId, input.key],
        );
        const row = existing.rows[0];
        if (!row || row.status === "expired") {
          throw new Error("Idempotency record disappeared during key resolution");
        }
        if (row.request_hash !== requestHash) throw new IdempotencyKeyReuseError();
        if (row.status !== "completed" || !row.response) {
          const error = new Error("An idempotent request with this key is in progress");
          Object.assign(error, { status: 409, code: "request-in-progress", retryAfterSeconds: 1 });
          throw error;
        }
        return { ...row.response, replayed: true } as IdempotentResponse<T>;
      }

      const response = await input.effect(tx);
      await tx.query(
        `UPDATE plt.idempotency_key
            SET status = 'completed', response = $3::jsonb
          WHERE tenant_id = $1 AND key = $2`,
        [input.actor.tenantId, input.key, JSON.stringify(response)],
      );
      return { ...response, replayed: false };
    });
  }
}

function hashRequest(body: unknown): string {
  return createHash("sha256").update(canonicalize(body)).digest("hex");
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

function isAcceptableKey(key: string): boolean {
  return key.length <= 255 && (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key) ||
    /^[A-Za-z0-9_-]{22,255}$/.test(key)
  );
}

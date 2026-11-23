import type { Pool, PoolClient } from "pg";
import type {
  QueryResult,
  SystemTransactionRunner,
  TransactionContext,
  TransactionRunner,
  VerifiedActor,
  VerifiedIdentityLookup,
} from "./index";

class PgTransactionContext implements TransactionContext {
  constructor(private readonly client: PoolClient) {}

  async query<Row = Record<string, unknown>>(
    sql: string,
    values: unknown[] = [],
  ): Promise<QueryResult<Row>> {
    const result = await this.client.query(sql, [...values]);
    return { rows: result.rows as Row[], rowCount: result.rowCount };
  }
}

async function inTransaction<T>(pool: Pool, work: (tx: TransactionContext) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let releaseError: Error | undefined;
  try {
    await client.query("BEGIN");
    const result = await work(new PgTransactionContext(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      // Preserve the operation error; releasing a failed connection discards it.
      releaseError = rollbackError instanceof Error ? rollbackError : new Error("Failed to roll back transaction");
    }
    throw error;
  } finally {
    client.release(releaseError);
  }
}

export class PostgresTransactionRunner implements TransactionRunner {
  constructor(private readonly appPool: Pool) {}

  run<T>(actor: VerifiedActor, work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    if (!actor.tenantId || !actor.userId) throw new TypeError("A verified tenant and user are required");
    return inTransaction(this.appPool, async (tx) => {
      await tx.query(
        "SELECT set_config('app.tenant_id', $1, true), set_config('app.user_id', $2, true), set_config('app.token_id', $3, true)",
        [actor.tenantId, actor.userId, actor.tokenId ?? ""],
      );
      return work(tx);
    });
  }

  runIdentityLookup<T>(
    identity: VerifiedIdentityLookup,
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    if (!identity.tenantId || !identity.issuer || !identity.subject) {
      throw new TypeError("A verified tenant, issuer, and subject are required");
    }
    return inTransaction(this.appPool, async (tx) => {
      await tx.query(
        "SELECT set_config('app.tenant_id', $1, true), set_config('app.oidc_issuer', $2, true), set_config('app.oidc_subject', $3, true)",
        [identity.tenantId, identity.issuer, identity.subject],
      );
      return work(tx);
    });
  }
}

/** Construct with a dedicated worker/migrator pool, never the HTTP app pool. */
export class PostgresSystemTransactionRunner implements SystemTransactionRunner {
  constructor(private readonly systemPool: Pool) {}

  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return inTransaction(this.systemPool, work);
  }
}

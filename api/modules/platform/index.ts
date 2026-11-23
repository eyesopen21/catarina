export type QueryResult<Row> = {
  rows: Row[];
  rowCount: number | null;
};

export interface TransactionContext {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
}

/** Identity produced only after the authentication and membership checks. */
export interface VerifiedActor {
  tenantId: string;
  userId: string;
  tokenId?: string;
}

/** Verified OIDC claims used only to resolve the local actor under RLS. */
export interface VerifiedIdentityLookup {
  tenantId: string;
  issuer: string;
  subject: string;
}

export interface TransactionRunner {
  run<T>(actor: VerifiedActor, work: (tx: TransactionContext) => Promise<T>): Promise<T>;
  runIdentityLookup<T>(
    identity: VerifiedIdentityLookup,
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T>;
}

/** Technical work uses a separately configured pool and is never request-injected. */
export interface SystemTransactionRunner {
  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

export { PostgresTransactionRunner, PostgresSystemTransactionRunner } from "./postgres-transaction";
export { OutboxRepository, type OutboxEventInput, type OutboxEvent } from "./outbox";
export { markEventProcessed } from "./processed-event";
export {
  IdempotencyService,
  IdempotencyKeyReuseError,
  type IdempotentResponse,
} from "./idempotency";

import type { SystemTransactionRunner, TransactionContext } from "./index";

export interface OutboxEventInput {
  eventId: string;
  tenantId: string;
  eventType: string;
  schemaVersion: number;
  payload: Readonly<Record<string, unknown>>;
  occurredAt?: Date;
}

export interface OutboxEvent extends OutboxEventInput {
  occurredAt: Date;
  createdAt: Date;
  publishedAt: Date | null;
}

type OutboxRow = {
  event_id: string;
  tenant_id: string;
  event_type: string;
  schema_version: number;
  payload: Record<string, unknown>;
  occurred_at: Date;
  created_at: Date;
  published_at: Date | null;
};

export class OutboxRepository {
  constructor(private readonly systemTransactions: SystemTransactionRunner) {}

  /** Must be called with the domain effect's transaction. */
  async append(tx: TransactionContext, event: OutboxEventInput): Promise<void> {
    if (!event.eventId || !event.tenantId || !event.eventType || event.schemaVersion < 1) {
      throw new TypeError("Outbox event requires id, tenant, type, and positive schema version");
    }
    await tx.query(
      `INSERT INTO plt.outbox_event
        (event_id, tenant_id, event_type, schema_version, payload, occurred_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, COALESCE($6, now()))`,
      [event.eventId, event.tenantId, event.eventType, event.schemaVersion, JSON.stringify(event.payload), event.occurredAt ?? null],
    );
  }

  /** Claims a batch; a crashed relay may redeliver these events (at-least-once). */
  claimUnpublished(limit = 100): Promise<OutboxEvent[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new RangeError("limit must be between 1 and 1000");
    return this.systemTransactions.run(async (tx) => {
      const result = await tx.query<OutboxRow>(
        `SELECT event_id, tenant_id, event_type, schema_version, payload, occurred_at, created_at, published_at
           FROM plt.outbox_event
          WHERE published_at IS NULL
          ORDER BY occurred_at, event_id
          FOR UPDATE SKIP LOCKED
          LIMIT $1`,
        [limit],
      );
      return result.rows.map(mapOutboxRow);
    });
  }

  /** Call only after successful publish. Failure before commit intentionally permits redelivery. */
  markPublished(eventId: string): Promise<boolean> {
    return this.systemTransactions.run(async (tx) => {
      const result = await tx.query(
        "UPDATE plt.outbox_event SET published_at = now() WHERE event_id = $1 AND published_at IS NULL",
        [eventId],
      );
      return result.rowCount === 1;
    });
  }
}

function mapOutboxRow(row: OutboxRow): OutboxEvent {
  return {
    eventId: row.event_id,
    tenantId: row.tenant_id,
    eventType: row.event_type,
    schemaVersion: row.schema_version,
    payload: row.payload,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

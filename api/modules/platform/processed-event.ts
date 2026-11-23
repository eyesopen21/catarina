import type { TransactionContext } from "./index";

/** Inserts a dedup marker in the caller's effect transaction; false means already processed. */
export async function markEventProcessed(
  tx: TransactionContext,
  input: { tenantId: string; consumer: string; eventId: string },
): Promise<boolean> {
  if (!input.tenantId || !input.consumer || !input.eventId) {
    throw new TypeError("tenantId, consumer, and eventId are required");
  }
  const result = await tx.query(
    `INSERT INTO plt.processed_event (tenant_id, consumer, event_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, consumer, event_id) DO NOTHING`,
    [input.tenantId, input.consumer, input.eventId],
  );
  return result.rowCount === 1;
}

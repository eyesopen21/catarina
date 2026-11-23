CREATE SCHEMA IF NOT EXISTS plt;

CREATE TABLE IF NOT EXISTS plt.outbox_event (
  event_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 180),
  schema_version integer NOT NULL CHECK (schema_version > 0),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_event_unpublished_idx
  ON plt.outbox_event (occurred_at, event_id) WHERE published_at IS NULL;
ALTER TABLE plt.outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE plt.outbox_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_event_tenant_scope ON plt.outbox_event;
CREATE POLICY outbox_event_tenant_scope ON plt.outbox_event
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS plt.processed_event (
  tenant_id uuid NOT NULL,
  consumer text NOT NULL CHECK (length(consumer) BETWEEN 1 AND 180),
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, consumer, event_id)
);
ALTER TABLE plt.processed_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE plt.processed_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS processed_event_tenant_scope ON plt.processed_event;
CREATE POLICY processed_event_tenant_scope ON plt.processed_event
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS plt.idempotency_key (
  tenant_id uuid NOT NULL,
  key text NOT NULL CHECK (
    key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    OR key ~ '^[A-Za-z0-9_-]{22,255}$'
  ),
  request_hash char(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  response jsonb,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, key),
  CHECK ((status = 'in_progress' AND response IS NULL) OR (status = 'completed' AND response IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idempotency_key_expiry_idx ON plt.idempotency_key (expires_at);
ALTER TABLE plt.idempotency_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE plt.idempotency_key FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS idempotency_key_tenant_scope ON plt.idempotency_key;
CREATE POLICY idempotency_key_tenant_scope ON plt.idempotency_key
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

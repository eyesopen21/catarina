BEGIN;

CREATE SCHEMA IF NOT EXISTS iam;

CREATE TABLE IF NOT EXISTS iam.tenant (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('individual', 'institution')),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closing')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.user (
  id uuid PRIMARY KEY,
  idp_issuer text NOT NULL,
  idp_subject text NOT NULL,
  display_name text NOT NULL,
  locale text NOT NULL DEFAULT 'es-CR',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idp_issuer, idp_subject)
);

CREATE TABLE IF NOT EXISTS iam.teacher_profile (
  user_id uuid PRIMARY KEY REFERENCES iam.user(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.role (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (code IN ('teacher', 'coordinator', 'tenant_admin', 'auditor'))
);

CREATE TABLE IF NOT EXISTS iam.membership (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES iam.tenant(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES iam.user(id) ON DELETE RESTRICT,
  role_id uuid NOT NULL REFERENCES iam.role(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  authz_version bigint NOT NULL DEFAULT 1 CHECK (authz_version > 0),
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from),
  UNIQUE (tenant_id, user_id, role_id)
);

CREATE INDEX IF NOT EXISTS membership_active_by_user_tenant
  ON iam.membership (tenant_id, user_id) WHERE status = 'active';

INSERT INTO iam.role (id, code) VALUES
  ('01a2008d-7400-7001-8000-000000000001', 'teacher'),
  ('01a2008d-7400-7002-8000-000000000002', 'coordinator'),
  ('01a2008d-7400-7003-8000-000000000003', 'tenant_admin'),
  ('01a2008d-7400-7004-8000-000000000004', 'auditor')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Synthetic-only local demo identity. The local test IdP signs tokens for this exact issuer+sub.
BEGIN;

INSERT INTO iam.tenant (id, kind, slug, name)
VALUES ('01a2008d-7400-7005-8000-000000000005', 'individual', 'demo-teacher', 'Docente Sintético Demo')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO iam.user (id, idp_issuer, idp_subject, display_name)
VALUES ('01a2008d-7400-7006-8000-000000000006', 'http://127.0.0.1:5100', 'synthetic-teacher-001', 'Docente Sintético')
ON CONFLICT (idp_issuer, idp_subject) DO NOTHING;

INSERT INTO iam.teacher_profile (user_id)
SELECT id FROM iam.user
WHERE idp_issuer = 'http://127.0.0.1:5100' AND idp_subject = 'synthetic-teacher-001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO iam.membership (id, tenant_id, user_id, role_id, status, valid_from)
SELECT '01a2008d-7400-7007-8000-000000000007', t.id, u.id, r.id, 'active', now()
FROM iam.tenant AS t
JOIN iam.user AS u ON u.idp_issuer = 'http://127.0.0.1:5100' AND u.idp_subject = 'synthetic-teacher-001'
JOIN iam.role AS r ON r.code = 'teacher'
WHERE t.slug = 'demo-teacher'
ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;

COMMIT;

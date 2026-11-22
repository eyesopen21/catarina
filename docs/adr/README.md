# Architecture Decision Records (ADR)

**Versión:** 0.2-draft · **Estado:** todos `Proposed` · **Formato:** compatible con MADR · **Fecha:** 2026-11-22

> **Ningún ADR está `Accepted`.** Son propuestas pendientes de validación por el propietario del producto ([12-Open-Decisions](../12-Open-Decisions.md)). Estados posibles: `Proposed`, `Accepted`, `Superseded`, `Rejected`.

Estructura de cada ADR: Context → Decision Drivers → Considered Options → Decision → Consequences → Risks → Revisit Triggers. Las decisiones se fundamentan en requisitos del [SRS](../02-SRS.md), restricciones de la suite v0.4 y propiedades técnicas documentadas de cada opción; **no** se usan puntajes. Las versiones, licencias y capacidades concretas de cada tecnología deben verificarse en su documentación oficial antes de aceptar el ADR (OD-10).

| ADR | Decisión propuesta | Requisitos que la condicionan |
|---|---|---|
| [ADR-001](ADR-001-monolito-modular.md) | Monolito modular con contextos delimitados | FR-PLN-02, FR-MEM-01, NFR-MNT-01, INV-01, INV-07 |
| [ADR-002](ADR-002-postgresql-almacen-primario.md) | PostgreSQL (JSONB, RLS, pgvector) como almacén primario | INV-05, INV-11, DAT-02, NFR-PORT-01, SPR-01 |
| [ADR-003](ADR-003-knowledge-graph-postgresql.md) | Grafo de conocimiento sobre PostgreSQL | FR-MEM-06, INV-08, DAT-04, FR-STU-02 |
| [ADR-004](ADR-004-modelo-documental-versionado.md) | Secciones tipadas, versiones inmutables, aprobación con CAS | FR-PLN-01, 03, 04, 05, 09, 15, INV-01, INV-02 |
| [ADR-005](ADR-005-concurrencia-occ-outbox.md) | OCC, CAS, outbox, consumidores idempotentes | FR-API-02, FR-API-03, FR-AGX-07, INV-11 |
| [ADR-006](ADR-006-boveda-identidad-estudiantil.md) | Bóveda de identidad con AEAD y claves envolventes | FR-STU-01..03, INV-06, SPR-02, SPR-09 |
| [ADR-007](ADR-007-ai-gateway-agnostico.md) | AI Gateway propio con adaptadores | FR-AIO-01, 03, 04, 05, 06, EIR-01 |
| [ADR-008](ADR-008-ejecucion-durable.md) | Cola en PostgreSQL; Temporal diferido | FR-AGX-01, FR-AGX-07, FR-AGX-08 |
| [ADR-009](ADR-009-orquestacion-agentica.md) | Supervisor–worker con workflow determinista propio | FR-PLN-02, FR-AGX-01, FR-AGX-03 |
| [ADR-010](ADR-010-mcp-tool-registry.md) | Tool Registry y MCP controlado; A2A diferido | FR-AGX-02, 04, 05, FR-STU-02, SPR-04 |
| [ADR-011](ADR-011-sandbox-bajo-demanda.md) | Sandbox bajo demanda solo en Etapa 4 | FR-AGX-06, SPR-05 |
| [ADR-012](ADR-012-identidad-autorizacion.md) | IdP OIDC + PDP RBAC/ABAC + RLS | FR-IAM-01..04, FR-IAM-06, EIR-02 |
| [ADR-013](ADR-013-stack-aplicacion.md) | TypeScript E2E condicionado al equipo | FR-API-01, NFR-USA-01 |
| [ADR-014](ADR-014-object-storage.md) | Almacenamiento compatible con S3 | FR-PLN-11, NFR-REL-01, SPR-07 |
| [ADR-015](ADR-015-observabilidad.md) | OpenTelemetry + Prometheus/Grafana sin PII | NFR-OBS-01, NFR-PRV-01 |
| [ADR-016](ADR-016-motor-curricular.md) | Reglas curriculares como datos + validadores deterministas | FR-CUR-01..06, BR-02, INV-12 |
| [ADR-017](ADR-017-contexto-dlp-egress.md) | Ensamblaje de contexto, DLP y egress | FR-AIO-02, FR-AIO-03, FR-MEM-05, SPR-04 |
| [ADR-018](ADR-018-memoria-pedagogica.md) | Eventos + hechos de memoria con procedencia | FR-MEM-01..10, INV-03, INV-04 |
| [ADR-019](ADR-019-sin-redis-mvp.md) | Sin Redis en el MVP | FR-API-07, NFR-SCL-01 |
| [ADR-020](ADR-020-multi-tenancy-rls.md) | Esquema compartido + RLS | FR-IAM-01, INV-05, SPR-01, NFR-SEC-03 |
| [ADR-021](ADR-021-estilo-api.md) | REST/OpenAPI 3.1, RFC 9457, AsyncAPI | FR-API-01..07 |
| [ADR-022](ADR-022-claves-secretos.md) | KMS/HSM + gestor de secretos | SPR-02, SPR-03, FR-AIO-05 |
| [ADR-023](ADR-023-render-documentos.md) | Renderizador determinista | FR-PLN-11, EIR-03, INV-09 |

# 05 — Especificaciones técnicas

**Versión:** 0.1-draft · **Estado:** Draft — elecciones tecnológicas **propuestas** (ADR `Proposed`) · **Fecha:** 2026-11-22
**Dependencias:** [02-SRS](02-SRS.md), [04](04-Software-Architecture.md), [adr/](adr/README.md) · **Contratos:** [contracts/](contracts/README.md)
**Decisiones pendientes:** OD-04, OD-10 (equipo, nube, proveedores), OD-03 (residencia)

> **Limitaciones de esta evaluación.** El análisis es **cualitativo**: no hay benchmarks propios ni puntajes. En esta pasada **no se verificaron en línea** versiones, licencias, precios ni postura de seguridad de las tecnologías nombradas (el entorno de elaboración fue documental). Antes de aceptar un ADR debe verificarse cada tecnología contra su documentación oficial y licencia vigentes (OD-10). Las referencias a estándares (RFC 9457, OpenAPI 3.1, JSON Schema 2020-12, AsyncAPI 3.x, ISO/IEC 25010, OWASP, NIST) son a sus versiones conocidas por el autor y deben confirmarse.

## 1. Método de evaluación (Architecture Trade-off Analysis)

1. Para cada decisión se enumeran opciones, **incluida la de diferir**.
2. Cada opción se contrasta con los **requisitos que discriminan** entre ellas (en su mayoría `P0`) y con los criterios del encargo: *Functional Fitness, Operational Complexity, TCO, Horizontal Scalability, Fault Tolerance, Vendor Lock-in, Security Boundaries, Maintainability, Latency & Throughput, Data Portability*.
3. No se asignan puntajes ni pesos: un requisito `P0` que una opción no puede cumplir la descarta; entre las que lo cumplen, prevalece la de menor complejidad operativa mientras no exista un disparador medido.
4. Regla de no sobreingeniería: ninguna opción de mayor complejidad (microservicios, Kubernetes, event sourcing, microVMs, Temporal, motor de grafos) entra al MVP sin un **disparador medible** (sección *Revisit Triggers* de cada ADR).

## 2. Análisis de trade-offs por decisión

| Decisión | Opciones evaluadas | Requisito o restricción que discrimina | Propuesta | Qué cambiaría la decisión |
|---|---|---|---|---|
| Estilo arquitectónico ([ADR-001](adr/ADR-001-monolito-modular.md)) | Monolito modular · microservicios · monolito sin módulos | INV-01/INV-07 exigen atomicidad entre aprobación, versión y evento; el encargo excluye microservicios sin necesidad demostrada; NFR-MNT-01 exige límites verificables | Monolito modular | Escalado independiente medido, ciclos de despliegue en conflicto o aislamiento exigido |
| Stack ([ADR-013](adr/ADR-013-stack-aplicacion.md)) | Next.js/React/TypeScript + NestJS · TypeScript + FastAPI · Java/.NET | FR-API-01 (contratos tipados compartidos); equipo desconocido (OD-10) | TypeScript E2E, condicionado al equipo | Equipo mayoritariamente Python → FastAPI, sin cambiar contratos |
| Almacén primario ([ADR-002](adr/ADR-002-postgresql-almacen-primario.md)) | PostgreSQL (JSONB, RLS, pgvector) · PostgreSQL + vector DB · documental + vector DB | INV-05 (RLS en el motor), INV-11 (índices únicos parciales), DAT-02 (exclusión temporal), DAT-04 (invalidar derivados en un solo lugar) | PostgreSQL | Recuperación vectorial que incumpla NFR-PERF-01 tras optimizar |
| Grafo ([ADR-003](adr/ADR-003-knowledge-graph-postgresql.md)) | Grafo sobre PostgreSQL · Neo4j · sin grafo | INV-08 y FR-STU-02: misma frontera de autorización y ninguna consulta libre por agentes | Grafo sobre PostgreSQL como proyección | Consultas validadas de más de tres saltos fuera de objetivo |
| Ejecución durable y colas ([ADR-008](adr/ADR-008-ejecucion-durable.md), [ADR-019](adr/ADR-019-sin-redis-mvp.md)) | Cola en PostgreSQL · Redis + librería · Temporal | El encolado debe ser atómico con el cambio de dominio (ADR-005); los workflows con esperas humanas largas son de la Etapa 3 (S26) | Cola en PostgreSQL; sin Redis | Criterios de entrada de 07 §5 para Temporal; cuello de botella medido para Redis |
| Orquestación agéntica ([ADR-009](adr/ADR-009-orquestacion-agentica.md)) | Workflow determinista propio · LangGraph · multiagente libre | FR-AGX-03 (gates humanos no omitibles); separación D/L/H (07 §3); S19/S26 advierten contra multiagente sin valor | Workflow propio; framework solo para pasos `L` tras spike | Evidencia de piloto de la Etapa 3 |
| Model gateway ([ADR-007](adr/ADR-007-ai-gateway-agnostico.md)) | Puerto propio + adaptadores · LiteLLM Proxy · SDK directo | FR-AIO-01 (independencia), FR-AIO-03 (DLP/egress en código propio), FR-AIO-06 (presupuestos) | Puerto propio; LiteLLM MAY ser un adaptador | Un gateway externo evaluado que aloje las mismas políticas con menos esfuerzo |
| MCP y A2A ([ADR-010](adr/ADR-010-mcp-tool-registry.md)) | Tool Registry con contratos · herramientas genéricas · A2A inmediato | FR-STU-02, INV-08, FR-AGX-02 | Registry con allowlist y scopes; A2A diferido | Socio institucional con caso de uso A2A |
| Sandbox ([ADR-011](adr/ADR-011-sandbox-bajo-demanda.md)) | Sin sandbox · contenedor endurecido (gVisor) · Firecracker · Kata | Ningún flujo del MVP ejecuta código no confiable; FR-AGX-06 y SPR-05 para la Etapa 4 | Sin sandbox en MVP; spike en Etapa 4 | Dos o más casos de uso validados que ejecuten código |
| Identidad y autorización ([ADR-012](adr/ADR-012-identidad-autorizacion.md)) | IdP OIDC (Keycloak u otro) + PDP RBAC/ABAC · autenticación propia · motor ReBAC | FR-IAM-02 (reglas por atributos y propósito), FR-IAM-03 (MFA/passkeys), FR-IAM-06 (revocación) | IdP OIDC + PDP interno + RLS | Complejidad de compartición institucional en la Etapa 2 |
| Claves y secretos ([ADR-022](adr/ADR-022-claves-secretos.md)) | KMS/secretos de la nube · Vault autoalojado · variables de entorno | SPR-02, SPR-03, crypto-shredding (DAT-03) | KMS/HSM + gestor de secretos; proveedor según OD-03/OD-10 | Decisión de nube y residencia |
| Multi-tenancy ([ADR-020](adr/ADR-020-multi-tenancy-rls.md)) | Esquema compartido + RLS · esquema por tenant · BD por tenant | Miles de tenants individuales; INV-05; NFR-SEC-03 | Esquema compartido + RLS | Institución con requisito contractual de aislamiento físico |
| Objetos ([ADR-014](adr/ADR-014-object-storage.md)) | Compatible con S3 · BLOB en BD · disco local | NFR-PORT-01, SPR-07, varias réplicas de `api`/`worker` | Compatible con S3, versionado | Proveedor y región |
| Observabilidad ([ADR-015](adr/ADR-015-observabilidad.md)) | OpenTelemetry + Prometheus/Grafana · solo logs · APM propietario | NFR-PRV-01 (sin PII en telemetría), NFR-OBS-01 | OpenTelemetry con redacción en el Collector | Costo del backend |

**Tecnologías evaluadas explícitamente:** Next.js/React/TypeScript, NestJS, FastAPI; monolito modular frente a microservicios; PostgreSQL, JSONB, RLS y pgvector; Neo4j frente a grafo en PostgreSQL; almacenamiento compatible con S3; Redis y colas; Temporal; LangGraph; LiteLLM; MCP y A2A; Firecracker, Kata y contenedores endurecidos; OpenTelemetry, Prometheus y Grafana; Keycloak, OIDC/OAuth 2.x, RBAC, ABAC y ReBAC; KMS, Vault y envelope encryption.

## 3. Baseline tecnológico propuesto (no aprobado)

| Capa | Propuesta MVP | Condición/alternativa |
|---|---|---|
| Frontend | React + TypeScript; editor por bloques propio sobre un componente de edición madura (a evaluar) | SSR/Next.js tras prototipo (ADR-013) |
| Backend | TypeScript (NestJS u equivalente) en monolito modular | FastAPI si el equipo es Python; contratos idénticos |
| Datos | PostgreSQL (RLS, JSONB, pgvector, btree_gist) | Verificar extensiones en el proveedor gestionado |
| Objetos | S3-compatible versionado | Proveedor por decidir |
| Jobs | Cola en PostgreSQL + worker | Temporal/otro en Etapa 3 con criterios (07 §5) |
| Identidad | IdP OIDC + PDP interno | Keycloak u otro (OD-04) |
| Claves | KMS/gestor de secretos | OD-03/OD-10 |
| IA | Gateway propio + adaptadores; 1 proveedor en MVP | LiteLLM como adaptador opcional |
| Observabilidad | OpenTelemetry + Prometheus + Grafana | Backend gestionado compatible |
| Contratos | OpenAPI 3.1, JSON Schema 2020-12, AsyncAPI 3 | CI de contratos |

## 4. Convenciones de la API REST (ADR-021)

- **Base:** `https://api.<dominio>/v1` (versión en la ruta). Recursos en plural y `kebab-case`; identificadores UUIDv7; fechas ISO 8601 UTC.
- **Autenticación:** OAuth 2.x/OIDC con *access tokens* de corta vida (JWT firmado); *scopes* por recurso; el `tenant_id` se deriva del token y de la membresía activa, **nunca** de un parámetro del cliente.
- **Autorización:** PDP interno (RBAC+ABAC+Grants) en cada solicitud, más RLS (09 §6). Un recurso de otro tenant responde `404` (no `403`) para no revelar existencia.
- **Acciones** que no son CRUD se modelan como subrecursos de acción: `POST /plans/{id}/sections/{sid}/approve`.
- **Operaciones largas:** `202 Accepted` + `Location` a un recurso `Task`/`Export` con `status`.

### 4.1 Recursos principales (resumen; contrato completo en [openapi.yaml](contracts/openapi.yaml))

| Recurso | Operaciones | Notas |
|---|---|---|
| `/groups` | GET, POST | Grupo por periodo |
| `/groups/{id}/roster` | GET, POST | Nombres descifrados por `VaultService` para el docente del grupo; auditado; no expuesto a agentes ni MCP |
| `/plans` | GET, POST, GET/PATCH `{id}` | Estado derivado + ETag |
| `/plans/{id}/sections` | GET, POST; GET `{sid}`; GET `{sid}/versions` | Secciones tipadas |
| `/plans/{id}/sections/{sid}/approve` · `/reopen` · `/revert` | POST | Aprobación explícita (INV-01/02) |
| `/plans/{id}/patches` | GET, POST; POST `{pid}/accept`, `{pid}/reject` | Con `If-Match` |
| `/plans/{id}/validations` | POST | Hallazgos con cita; `validation_incomplete` |
| `/plans/{id}/draft-requests` | POST (202) | Crea `Task` de borrador |
| `/plans/{id}/exports` · `/exports/{eid}` | POST (202), GET | Requiere atestación |
| `/plans/{id}/reflections` | POST | `record_reflection`; lleva el plan a `implemented` y `reflected` |
| `/plans/{id}/events` | GET | `DecisionEvent` (solo lectura) |
| `/groups/{id}/memory-facts` · `/memory-facts/{fid}` | GET, POST; GET/DELETE `{fid}`; POST `{fid}/confirm`, `/reject`, `/retract` | Solo docente confirma |
| `/context-manifests/{mid}` | GET | «Por qué recordé esto» |
| `/curriculum/outcomes` · `/curriculum/rules` | GET | Solo lectura, por versión curricular |
| `/tasks/{tid}` · `/tasks/{tid}/cancel` · `/approval-gates/{gid}/resolve` | GET; POST; POST | Gates en Etapa 3 |
| Suscripciones de webhooks | — | Etapa 2: el contrato se añade al abrir E9 (eventos ya definidos en AsyncAPI) |

## 5. Modelo de error (RFC 9457) — FR-API-01

`Content-Type: application/problem+json`. Campos: `type` (URI estable), `title`, `status`, `detail`, `instance`, más extensiones `code`, `errors[]` (validación), `retry_after_seconds`, `trace_id`. **Nunca** incluir PII ni contenido de prompts.

| `type` (sufijo) | HTTP | Cuándo |
|---|---|---|
| `validation-failed` | 422 | Esquema/regla de negocio inválida (`errors[]`) |
| `section-approved` | 409 | Patch sobre sección aprobada sin `reopen` |
| `patch-stale` | 409 | `base_version_id` ya no es la actual |
| `version-mismatch` | 409 | Se aprueba una `artifact_version_id` que ya no es la actual |
| `request-in-progress` | 409 | Misma `Idempotency-Key` con una solicitud aún en curso (`Retry-After`) |
| `precondition-required` | 428 | Falta `If-Match` |
| `precondition-failed` | 412 | `If-Match` no coincide |
| `idempotency-key-reuse` | 422 | Misma clave con cuerpo distinto |
| `forbidden` | 403 | Autenticado sin permiso/propósito |
| `not-found` | 404 | No existe o fuera del tenant |
| `curriculum/unsupported-level` | 422 | Nivel/modalidad sin plantilla (FR-CUR-04) |
| `export/incomplete-annex` | 422 | Falla INV-09/INV-10 |
| `rate-limited` | 429 | Límite excedido (`Retry-After`) |
| `budget-exceeded` | 429 | Presupuesto de tokens/costo |
| `egress-blocked` | 422 | Política DLP/egress impide la operación de IA |
| `provider-unavailable` | 503 | Todos los proveedores fallan; editor sigue disponible |

Esquema: [problem-details.schema.json](contracts/schemas/problem-details.schema.json).

## 6. Concurrencia optimista: ETag / If-Match — FR-API-02

- Todo recurso mutable devuelve `ETag: W/"<row_version>"`.
- `PATCH`/`PUT`/`DELETE`/acciones de estado **requieren** `If-Match`; ausente → `428`; no coincide → `412` con el ETag actual en `Link`/cuerpo para reintento informado.
- `accept_patch` valida además `base_version_id` (409 `patch-stale`); `approve` valida `artifact_version_id` (409 si ya no es la actual).
- Semántica detallada y pruebas: [08](08-Concurrency-Consistency.md).

## 7. Idempotencia — FR-API-03

- Cabecera `Idempotency-Key` (UUID/clave aleatoria ≥ 128 bits) en `POST` con efectos laterales (crear, aceptar, aprobar, exportar, solicitar borrador).
- Almacenamiento en `plt.idempotency_key(tenant_id, key, request_hash, response, status, expires_at)` con unicidad `(tenant_id, key)`; **TTL provisional 24 h**.
- Misma clave + mismo `request_hash` → se devuelve la respuesta original (incluye `Idempotency-Replayed: true`); distinto cuerpo → `422 idempotency-key-reuse`; solicitud en curso → `409 request-in-progress` con `Retry-After`.
- El efecto y el registro de idempotencia se confirman en la **misma transacción** (08 §3).

## 8. Paginación, filtrado y ordenamiento — FR-API-04

- **Cursor** opaco: `?limit=` (por defecto 25, máx. 100) y `?cursor=`; respuesta `{items, next_cursor}`. Orden estable `(created_at, id)`.
- **Filtros** declarados por recurso (`?state=`, `?group_id=`, `?subject=`, `?kind=`); campos no declarados → `422`.
- **Orden:** `?sort=-updated_at,title` (lista permitida por recurso).
- No se ofrece paginación por offset en colecciones grandes.

## 9. Versionado y compatibilidad — FR-API-05

- `/v1` estable. **Cambios compatibles** (añadir campos opcionales/recursos/valores de enum documentados como extensibles) sin nueva versión. **Incompatibles** (eliminar/renombrar campos, cambiar semántica, endurecer validaciones) → `/v2`.
- Los clientes **MUST** ignorar campos desconocidos; los enums se documentan como abiertos.
- Deprecación: cabeceras `Deprecation` y `Sunset`, aviso ≥ 6 meses *(provisional)*, y registro en el changelog de contratos.
- CI ejecuta un comparador de contratos (OpenAPI diff) y bloquea cambios incompatibles en `v1`.

## 10. Webhooks y eventos de dominio — FR-API-06

- Catálogo de eventos: [asyncapi.yaml](contracts/asyncapi.yaml) (`PatchAccepted`, `SectionApproved`, `ExportCompleted`, `MemoryFactConfirmed`, `TaskStateChanged`, …). **Sin PII** en payloads: solo IDs y metadatos.
- Entrega **at-least-once** desde el outbox; cada evento tiene `event_id` único (UUIDv7), `occurred_at`, `tenant_id`, `schema_version`. Los consumidores **MUST** deduplicar por `event_id`.
- Webhooks: firma `X-Signature: sha256=<HMAC>` con secreto por suscripción rotado; reintentos con backoff exponencial con jitter; DLQ visible para el suscriptor; reproducción manual.

## 11. Rate limiting y cuotas — FR-API-07

| Alcance | Límite provisional | Respuesta |
|---|---|---|
| Por usuario (lecturas) | 120 req/min | `429` + `Retry-After` + `RateLimit-*` |
| Por usuario (escrituras) | 60 req/min | idem |
| Por tenant (global) | 600 req/min | idem |
| Llamadas de IA | Presupuesto diario de tokens por tenant/usuario (FR-AIO-06) | `429 budget-exceeded` |
| Export | 10/hora/usuario | `429` |

*Todos los valores son provisional engineering targets;* se calibrarán con la línea base del piloto.

## 12. Interfaces tipadas (puertos)

Definiciones ilustrativas en [contracts/interfaces.md](contracts/interfaces.md) (sin lógica de implementación). Contratos clave:

| Interfaz | Responsabilidad | Invariantes de contrato |
|---|---|---|
| `LLMProvider` | `complete`, `stream`, `embed`, `capabilities`, `dataPolicy` | No recibe datos de clase superior a la que su `dataPolicy.tier` permite; errores tipados (`ProviderUnavailable`, `RateLimited`, `ContentFiltered`, `Timeout`) |
| `ToolRegistry` | `register`, `list(agent)`, `invoke(call)` | Allowlist por agente; validación de entrada/salida; scopes; auditoría |
| `AgentRuntime` | `submit(task)`, `resume`, `cancel`, `onCheckpoint` | Idempotencia por `(task_id, step_key)`; fencing |
| `DocumentRenderer` | `render(model, template, options) → RenderedDocument` | **Determinista**; el resultado incluye `content_hash` |
| `MemoryRetrieval` | `retrieve(query, actor, purpose) → ContextItems` | Aplica permisos, vigencia, propósito; devuelve procedencia y razón |
| `AuthorizationPort` | `check(actor, action, resource, purpose)` | Decisión con TTL corto; respeta revocación |
| `DecisionLog` | `append(event)` | Append-only; misma transacción |
| `KeyService` | `wrap/unwrap(dek)`, `rotate` | Nunca devuelve KEK |

## 13. MCP Tool Contracts — FR-AGX-05

- Cada herramienta tiene un contrato JSON en [contracts/mcp-tools/](contracts/mcp-tools/) con: `name`, `description`, `inputSchema`, `outputSchema`, `requiredScopes`, `sideEffects`, `dataClassMax`, `requiresApproval`, `rateLimit`.
- **Reglas de diseño:**
  1. Ninguna herramienta tiene alcance `vault:*` ni expone consultas libres al grafo/BD (FR-STU-02, INV-08).
  2. Las herramientas de escritura **proponen** (`plan:propose`, `memory:propose`); ninguna `approve`/`confirm` (INV-02/03/04).
  3. La salida de herramientas se trata como **contenido no confiable** (SPR-04).
  4. Las herramientas se ejecutan con la **identidad y permisos del docente solicitante**, no con privilegios del agente.
  5. Esquemas validados en CI y en tiempo de ejecución; parámetros extra → rechazo (`additionalProperties: false`).
- **Herramientas definidas (diseño):** `curriculum.search_outcomes`, `plan.read_sections`, `plan.propose_patch`, `memory.search_facts`, `memory.propose_fact`.
- **A2A:** diferido (ADR-010).

## 14. Renderizador de documentos (`DocumentRenderer`) — EIR-03

- **Entrada:** `RenderModel` (versiones concretas de secciones + plantilla + metadatos); **no** consulta la BD.
- **Salida:** DOCX/PDF/HTML + `content_hash`; **determinismo** (misma entrada y plantilla → mismo hash; sin marcas de tiempo variables dentro del contenido).
- **Separación:** el material del estudiante y el solucionario docente se renderizan como documentos distintos (FR-PLN-07).
- **Validaciones previas:** INV-09 (anexos completos) e INV-10; referencias a anexos sin duplicación (BR-05).
- **Plantillas:** por asignatura/modalidad y versión de plantilla MEP; las plantillas institucionales se tratan como `local_institution_policy`.
- **Atestación:** el export registra `request_export` con la atestación docente (FR-PLN-15); el documento incluye únicamente lo que el docente decidió exportar; sin sellos de «cumple MEP».

## 15. Decisiones pendientes
OD-04 (IdP/nube), OD-10 (equipo y verificación tecnológica), OD-03 (residencia/retención), OD-09 (presupuesto por plan que afecta routing).

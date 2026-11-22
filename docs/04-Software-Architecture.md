# 04 — Software Architecture Document (SAD)

**Versión:** 0.1-draft · **Estado:** Draft — arquitectura **propuesta**, pendiente de aceptación de ADR · **Fecha:** 2026-11-22
**Método:** C4 Model + DDD · **Dependencias:** [02-SRS](02-SRS.md), [03](03-Domain-Model-Pedagogy.md), [adr/](adr/README.md)
**Decisiones pendientes:** OD-04 (IdP y nube), OD-03 (residencia), OD-10 (stack/proveedores) — la arquitectura es independiente de ellas por diseño (contratos y puertos).

## 1. Alcance y drivers

**Drivers arquitectónicos (de mayor a menor peso):**
1. **Integridad pedagógica:** INV-01..04 (aprobado inmutable, memoria con procedencia).
2. **Privacidad de menores y aislamiento:** INV-05/06/08, FR-STU-*.
3. **Independencia del proveedor de IA:** FR-AIO-01, ADR-007.
4. **Operabilidad para un equipo pequeño:** monolito modular, un motor de datos (ADR-001/002).
5. **Evolutividad:** límites explícitos para extraer servicios si se demuestra necesidad.
6. **Degradación elegante:** el trabajo del docente no depende de la disponibilidad de la IA (NFR-AVL-01).

**Fuera de alcance del MVP (justificado):** microservicios, Kubernetes, event sourcing global, Redis, Temporal, microVMs, Neo4j (ADR-001/003/008/011/019).

## 2. Estilo arquitectónico: monolito modular (ADR-001)

- Un **código base** y un **artefacto desplegable**, ejecutado en dos roles: `api` (HTTP) y `worker` (trabajos asíncronos: relay del outbox, export, validación, tareas de agentes). Mismo binario/imagen, distinto comando.
- **7 contextos delimitados** con API pública in-process (puertos) y **propiedad exclusiva de sus tablas**; ningún módulo lee o escribe tablas de otro (verificado en CI, NFR-MNT-01).
- Comunicación entre contextos: (a) llamadas síncronas a puertos permitidos por la matriz de §5; (b) **eventos de dominio** vía *transactional outbox* (at-least-once, consumidores idempotentes); (c) nunca SQL cruzado.
- **Disparador de extracción** (ADR-001): escalado independiente medido, ciclo de despliegue distinto o aislamiento de seguridad. Candidatos: AI Orchestration y Agent Execution.

## 3. System Context (C4 L1)

Diagrama: [diagrams/c4-l1-context.md](diagrams/c4-l1-context.md).

| Actor / sistema | Tipo | Interacción | Frontera |
|---|---|---|---|
| Docente | Persona | Coautoría, aprobación, memoria | TB-1 |
| Coordinación / Admin del tenant | Persona | Plantillas, miembros, políticas (sin acceso a lo privado del docente) | TB-1 |
| Experto curricular MEP / especialista | Persona | Valida reglas y calidad pedagógica | TB-1 |
| **Plataforma Docente** | Sistema | Objeto de este SAD | — |
| IdP OIDC | Sistema externo | Autenticación, MFA, SSO | TB-2 |
| Proveedores de IA | Sistema externo | Inferencia/embeddings vía AI Gateway con DLP | TB-5 |
| KMS / gestor de secretos | Sistema externo | Claves de cifrado y secretos | TB-4 |
| Portal MEP (documentos oficiales) | Fuente externa | Fuentes curriculares (ingesta controlada y revisada) | TB-2 |
| Servidores MCP de terceros | Sistema externo (Etapa 3+) | Herramientas controladas | TB-6 |
| LMS/Drive/M365 | Sistema externo (Etapa 2+) | Integraciones opcionales | TB-2 |

Los estudiantes **no** son usuarios del sistema; sus materiales se exportan y entregan por el docente fuera de la plataforma.

## 4. Containers (C4 L2)

Diagrama: [diagrams/c4-l2-containers.md](diagrams/c4-l2-containers.md).

| Contenedor | Tecnología (propuesta) | Responsabilidad | Etapa |
|---|---|---|---|
| **Web App** (CMP-WEB) | React/TypeScript (SPA o SSR; ADR-013) | Editor por bloques, conversación, diff, aprobación | MVP |
| **API** | Monolito modular (CMP-APIGW + contextos) | REST/OpenAPI, authn/authz, dominio síncrono | MVP |
| **Worker** (CMP-PLT-WORKER) | Mismo código base | Outbox relay, export, validación pesada, tareas de IA/agentes | MVP |
| **PostgreSQL** | PostgreSQL (RLS, JSONB, pgvector) | Sistema de registro; esquemas por contexto + `vault` | MVP |
| **Object Storage** | S3-compatible, versionado | Exports, adjuntos, anexos binarios | MVP |
| **Egress Proxy** | Proxy de salida con allowlist | Único camino hacia proveedores de IA/MCP externos (SPR-05) | MVP |
| **IdP** | OIDC (OD-04) | Identidad y MFA | MVP |
| **KMS / Secrets** | KMS gestionado o Vault (ADR-022) | Claves y secretos | MVP |
| **Observability stack** (CMP-PLT-OBS) | OpenTelemetry Collector, Prometheus, Grafana (ADR-015) | Trazas/métricas/logs sin PII | MVP |
| **Sandbox Runtime** (CMP-AGX-SBX) | A decidir (ADR-011) | Ejecución aislada bajo demanda | Etapa 4 |

## 5. Bounded Contexts, dependencias permitidas y ownership

### 5.1 Mapa de contextos

| ID | Contexto | Responsabilidad | Datos propios (esquema) | Lenguaje central |
|---|---|---|---|---|
| **BC-IAM** | Identity & Access | Tenants, usuarios, membresías, roles, concesiones, autenticación, autorización (PDP), **bóveda de identidad estudiantil**, auditoría | `iam`, `vault` | Tenant, Membership, Grant, StudentIdentity |
| **BC-CUR** | Curriculum | Fuentes MEP, versiones, aprendizajes, plantillas, reglas y validadores | `cur` | Source, Version, Rule, Template |
| **BC-PLN** | Lesson Planning | Planes, secciones, patches, aprobación, impacto, anexos, validación pedagógica, reflexión | `pln` | LessonPlan, PlanSection, Patch, Approval |
| **BC-DOC** | Documents | Versiones inmutables de artefactos, renderizado y exportación | `doc` | ArtifactVersion, ExportJob |
| **BC-MEM** | Pedagogical Memory | Conversaciones, eventos de decisión, hechos de memoria, grupos, perfiles pedagógicos, **grafo de conocimiento** | `mem`, `kg` | DecisionEvent, MemoryFact, Group, GraphNode |
| **BC-AIO** | AI Orchestration | AI Gateway, routing, DLP/egress, ensamblaje de contexto, presupuestos | `aio` | ModelCall, ContextManifest, Budget |
| **BC-AGX** | Agent Execution | Agentes, tareas, workflows, registro de herramientas/MCP, aprobaciones de gates, sandbox | `agx` | Agent, Task, Execution, ToolInvocation |
| (kernel) | Platform | Outbox, idempotencia, observabilidad, configuración | `plt` | OutboxEvent, IdempotencyKey |

> **Decisión de ubicación (propuesta):** `Group` y `PedagogicalProfile` viven en BC-MEM (contexto pedagógico); `Student` pseudónimo (solo `student_ref`+tenant) en BC-IAM junto a la bóveda. Alternativa: contexto «Roster» propio — registrada en OD-12.

### 5.2 Matriz de dependencias permitidas (fila **puede llamar** a columna)

| ↓ depende de → | IAM | CUR | PLN | DOC | MEM | AIO | AGX |
|---|---|---|---|---|---|---|---|
| **IAM** | — | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **CUR** | ✓ authz | — | ✗ | ✗ | ✗ | ✗ | ✗ |
| **DOC** | ✓ authz | ✗ | ✗ | — | ✗ | ✗ | ✗ |
| **PLN** | ✓ authz | ✓ reglas | — | ✓ versiones | ✓ `DecisionLog` (misma tx) | ✗ | ✗ |
| **MEM** | ✓ authz | ✓ ids (lectura) | ✗ (eventos) | ✗ | — | ✗ | ✗ |
| **AIO** | ✓ authz | ✓ lectura | ✓ lectura (`ContextSource`) | ✗ | ✓ `MemoryRetrieval` | — | ✗ |
| **AGX** | ✓ authz | ✓ lectura | ✓ comandos+lectura (con identidad del docente) | ✗ | ✓ lectura/propuesta | ✓ `LLMProvider` | — |

Reglas: sin ciclos; `✗` se hace cumplir con el verificador de dependencias (NFR-MNT-01); PLN **no** llama a AIO/AGX (la generación es una `Task` asíncrona que vuelve como `Patch` propuesto); MEM consume eventos de PLN/CUR, no los llama.

### 5.3 Mecanismos de comunicación por par

| Origen → destino | Mecanismo | Consistencia |
|---|---|---|
| PLN → MEM (`DecisionLog.append`) | Llamada in-process dentro de la **misma transacción** | Fuerte |
| PLN → DOC (nueva versión) | In-process, misma transacción | Fuerte |
| PLN/CUR → MEM (proyección a grafo) | Evento vía outbox | Eventual (idempotente) |
| PLN → AGX (solicitar borrador) | Crea `Task` (comando) + evento | Eventual |
| AGX → PLN (propone patch) | Comando de aplicación con `base_version` | Fuerte en destino; rechazo si obsoleto |
| Cualquiera → IAM | `AuthorizationPort.check` | Fuerte; decisión con TTL corto |
| AIO → proveedores | HTTP vía Egress Proxy | Sin garantías; timeouts/circuit breakers |

## 6. Componentes (C4 L3) y registro

Diagramas: [diagrams/c4-l3-core-api.md](diagrams/c4-l3-core-api.md) (contextos de dominio) y [diagrams/c4-l3-ai-agents.md](diagrams/c4-l3-ai-agents.md) (AI Orchestration + Agent Execution).

| ID | Componente | Contexto | Responsabilidad | Requisitos principales |
|---|---|---|---|---|
| CMP-WEB | Web App | — | Editor, conversación, diff, aprobación, modos acompañado/experto | NFR-USA-01, FR-PLN-14 |
| CMP-APIGW | API layer | Plataforma | Authn (JWT/OIDC), rate limit, idempotencia, ETag, errores RFC 9457, versionado | FR-API-* |
| CMP-CUR-SRC | Source Catalog | CUR | Fuentes, hash, vigencia, validación experta | FR-CUR-01 |
| CMP-CUR-RULE | Rule Engine | CUR | Reglas dirigidas por datos y validadores deterministas | FR-CUR-02..06 |
| CMP-PLN-DOC | Plan Service | PLN | Agregado `LessonPlan`/`PlanSection`, estado, enlaces | FR-PLN-01,09,10 |
| CMP-PLN-PATCH | Patch & Diff Service | PLN | Crear/aceptar/rechazar patches, diff, detección de obsolescencia | FR-PLN-03,04 |
| CMP-PLN-APPR | Approval Service | PLN | Aprobar/reabrir con CAS y reglas de actor; ledger | FR-PLN-05,15, INV-01/02/11 |
| CMP-PLN-IMPACT | Impact Analyzer | PLN | Grafo de dependencias entre secciones → conjunto de impacto | FR-PLN-06 |
| CMP-PLN-VAL | Pedagogical Validator | PLN | Alineación aprendizaje↔indicador, anexos, competencias, evidencia | FR-PLN-08, INV-09/10 |
| CMP-PLN-ANX | Annex Service | PLN | Numeración por primera mención, completitud de anexos | FR-PLN-07, BR-05 |
| CMP-DOC-VER | Artifact Version Store | DOC | Versiones inmutables con hash, ledger de contribuciones | INV-01, FR-PLN-15 |
| CMP-DOC-REND | Document Renderer | DOC | Render determinista DOCX/PDF/HTML | FR-PLN-11, EIR-03 |
| CMP-MEM-EVT | Decision Event Log | MEM | Eventos append-only, conversación | FR-MEM-01,07, INV-07 |
| CMP-MEM-FACT | Memory Service | MEM | Hechos/evidencias, confirmación, rectificación, caducidad | FR-MEM-02..10 |
| CMP-MEM-GRAPH | Knowledge Graph Service | MEM | Proyección del grafo + **recuperación autorizada** (`GraphAccessService`) | FR-MEM-06, INV-08 |
| CMP-IAM-AUTHN | Authentication Adapter | IAM | OIDC, sesión, MFA | FR-IAM-03, EIR-02 |
| CMP-IAM-AUTHZ | Policy Decision Point | IAM | RBAC+ABAC+Grants; propósito; revocación | FR-IAM-02,04,06 |
| CMP-IAM-TEN | Tenant & Membership | IAM | Tenants, membresías, roles | FR-IAM-01 |
| CMP-IAM-VAULT | Identity Vault | IAM | Identidad estudiantil AEAD, claves envolventes | FR-STU-01..03, INV-06 |
| CMP-IAM-AUDIT | Audit Log | IAM | Registro inmutable de accesos sensibles | FR-IAM-05, INV-07 |
| CMP-AIO-GW | AI Gateway | AIO | Puerto `LLMProvider`, adaptadores, validación de salida | FR-AIO-01,05,07 |
| CMP-AIO-DLP | DLP & Egress Policy | AIO | Clasificación de datos, redacción, matriz de egress | FR-AIO-03 |
| CMP-AIO-ROUTER | Model Router | AIO | Routing por tarea, fallback, circuit breakers, timeouts | FR-AIO-04 |
| CMP-AIO-CTX | Context Assembler | AIO | Pipeline de contexto autorizado + manifiesto | FR-AIO-02, FR-MEM-05 |
| CMP-AIO-BUD | Budget Manager | AIO | Presupuestos de tokens/costo | FR-AIO-06 |
| CMP-AGX-SUP | Supervisor / Workflow Engine | AGX | Supervisor–worker, máquina de estados, gates | FR-AGX-01,03 |
| CMP-AGX-TASK | Task Store & Queue | AGX | Tareas, leases/fencing, reintentos, DLQ | FR-AGX-07 |
| CMP-AGX-TOOLS | Tool Registry / MCP Server | AGX | Allowlist, scopes, validación de parámetros | FR-AGX-02,05 |
| CMP-AGX-SBX | Sandbox Manager | AGX | Ejecución aislada bajo demanda (Etapa 4) | FR-AGX-06 |
| CMP-PLT-OUTBOX | Outbox Relay | Plataforma | Publicación at-least-once, dedup | FR-API-06 |
| CMP-PLT-OBS | Observability | Plataforma | OTel, métricas, auditoría de costos sin PII | NFR-OBS-01 |
| CMP-PLT-WORKER | Worker Runtime | Plataforma | Ejecución de trabajos asíncronos | FR-PLN-11 |

## 7. Modelo de dominio por contexto (DDD)

Resumen táctico (detalle de columnas en [06](06-Data-Architecture.md)).

| Contexto | Aggregate roots | Entidades | Value Objects | Application services | Domain events publicados |
|---|---|---|---|---|---|
| **IAM** | `Tenant`, `User`, `StudentIdentity`† | `Membership`, `RoleAssignment`, `Grant`, `Student` (pseudónimo) | `EncryptedPayload`, `KeyRef`, `TenantId`, `Purpose` | `AuthorizationService`, `TenantService`, `VaultService`, `AuditService` | `MembershipRevoked`, `GrantCreated`, `GrantRevoked` |
| **CUR** | `CurriculumSource`, `CurriculumVersion` | `LearningOutcome`, `CurriculumRule`, `PlanTemplate` | `SourceRef`, `Severity`, `RuleClass` | `CurriculumQuery`, `RuleValidationService`, `SourceIngestion` | `CurriculumVersionPublished` |
| **PLN** | `LessonPlan` | `PlanSection`, `SectionLink`, `Patch`, `Approval`, `Reflection` | `SectionKind`, `ContentHash`, `ImpactSet`, `PlanState` | `PlanCommandService` (create, propose, accept/reject, approve, reopen, revert), `ImpactService`, `ExportService` | `PlanCreated`, `PatchProposed`, `PatchAccepted`, `PatchRejected`, `PatchStale`, `SectionApproved`, `SectionReopened`, `PlanStateChanged`, `ExportRequested`, `ReflectionRecorded` |
| **DOC** | `Artifact` | `ArtifactVersion` (inmutable), `ExportJob` | `ContentHash`, `ObjectRef` | `ArtifactVersionService`, `RenderService` | `ArtifactVersionCreated`, `ExportCompleted`, `ExportFailed` |
| **MEM** | `Conversation`, `DecisionEventLog`, `MemoryFact`, `Group` | `ConversationTurn`, `MemoryEvidence`, `PedagogicalProfile`, `GroupMembership`, `GraphNode`, `GraphEdge` | `MemoryCondition`, `ValidityPeriod`, `Audience`, `Confidence` | `DecisionLog`, `MemoryService`, `MemoryRetrieval`, `GraphAccessService` | `MemoryFactProposed`, `MemoryFactConfirmed`, `MemoryFactRetracted`, `GroupPeriodClosed` |
| **AIO** | `ModelCall`, `Budget` | `ContextManifest`, `ProviderPolicy`, `RoutingPolicy` | `DataClass`, `ProviderTier`, `TokenBudget` | `ContextAssembler`, `GatewayService`, `DlpService`, `RouterService` | `ModelCallCompleted` (solo metadatos), `BudgetExceeded` |
| **AGX** | `Agent`, `Task` | `Execution`, `ToolInvocation`, `ApprovalGate`, `Checkpoint` | `TaskState`, `ToolScope`, `LeaseToken` | `SupervisorService`, `TaskService`, `ToolRegistry` | `TaskStateChanged`, `ApprovalGateRequested`, `ApprovalGateResolved` |

† `StudentIdentity` es raíz de agregado en el esquema `vault`; solo accesible por `VaultService`.

**Reglas de invariantes por agregado** (el agregado es la frontera de consistencia):
- `LessonPlan` (raíz) garantiza: una sola versión actual por sección; transiciones de estado válidas; `Approval` solo sobre la versión actual; sin patch sobre `approved`.
- `MemoryFact`: transiciones `candidate→confirmed|rejected`, `confirmed→superseded|retracted|expired`; confirmación solo por docente con evidencia.
- `Task`: transiciones de la máquina de 07 §4 con *lease* y *fencing*.

## 8. Patrones de integración

| Patrón | Uso | Detalle |
|---|---|---|
| **Transactional Outbox** | Eventos de dominio → worker, grafo, webhooks | 08 §3; ADR-005 |
| **Consumidores idempotentes** | Proyecciones, webhooks, tareas | Tabla `processed_event(consumer, event_id)` |
| **Anti-corruption layer** | Adaptadores de proveedores LLM, MCP, IdP, KMS, renderizador | Puertos tipados en [contracts/interfaces.md](contracts/interfaces.md) |
| **Ports & Adapters** | Todo acceso externo | Permite cambiar proveedor sin tocar dominio |
| **CQRS ligero** | Vistas de lectura (p. ej. diff/impacto, manifiestos) | Sin event sourcing; lecturas desde tablas |
| **Saga/compensación (mínima)** | Export (objeto + metadatos), borrado en cascada | 08 §4 (R-08) |
| **Webhooks firmados** | Integraciones institucionales (Etapa 2) | HMAC; at-least-once |
| **Integraciones LMS/Drive/M365** | Etapa 2+ con scopes mínimos | EIR-04 |

## 9. Límites de persistencia y ownership de datos

| Esquema | Dueño | Contenido | Quién puede escribir | Quién puede leer |
|---|---|---|---|---|
| `iam` | BC-IAM | tenants, users, memberships, grants, students (seudónimo), `audit_log` | IAM | IAM (y otros solo vía puerto) |
| `vault` | BC-IAM (VaultService) | `student_identity` cifrada | Solo `VaultService` (rol `vault_rw`) | Solo `VaultService` |
| `cur` | BC-CUR | fuentes, versiones, reglas, plantillas, aprendizajes | CUR | CUR; público lectura vía puerto |
| `pln` | BC-PLN | planes, secciones, enlaces, patches, approvals, reflexiones | PLN | PLN; AIO/AGX por puerto de lectura |
| `doc` | BC-DOC | artefactos, versiones, exports | DOC | DOC |
| `mem` | BC-MEM | conversaciones, `decision_event`, hechos, evidencias, grupos, perfiles | MEM | MEM; AIO por `MemoryRetrieval` |
| `kg` | BC-MEM | `graph_node`, `graph_edge` (particiones pública/privada) | Proyectores de MEM | Solo `GraphAccessService` |
| `aio` | BC-AIO | `model_call`, `context_manifest`, `budget`, políticas | AIO | AIO |
| `agx` | BC-AGX | agentes, tareas, ejecuciones, tool invocations, gates | AGX | AGX |
| `plt` | Plataforma | `outbox_event`, `idempotency_key`, `processed_event` | Todos (solo `outbox_event` por transacción) | Relay |

**Roles de BD:** `app_rw` (sin `BYPASSRLS`), `vault_rw` (solo `vault`), `migrator` (DDL), `readonly_bi` (agregados anonimizados, post-MVP). Todo con RLS `FORCE` salvo `cur` y partición pública del grafo (datos no personales).

## 10. Deployment View

Diagrama: [diagrams/deployment.md](diagrams/deployment.md).

- **Entornos:** `dev` (local/efímero), `staging` (datos sintéticos), `prod` (única región inicial; residencia por OD-03). Sin datos reales en `dev/staging`.
- **Cómputo:** contenedores en un runtime gestionado (ECS/Cloud Run/App Service/VM con Docker, a decidir): `api` ≥2 réplicas, `worker` ≥1 (escala por profundidad de cola). **Sin Kubernetes** en MVP (no se demostró necesidad).
- **Datos:** PostgreSQL gestionado con PITR y réplica de lectura opcional; almacén de objetos versionado y cifrado; backups cifrados (09 §12).
- **Red:** subred pública solo para el balanceador/WAF; `api/worker` en subred privada; **egreso únicamente por Egress Proxy**; BD y objetos sin acceso público.
- **IaC:** descripción declarativa completa (11 §7).
- **Escalado inicial:** NFR-SCL-01 (provisional); el cuello de botella esperado es la latencia/cuotas de proveedores de IA, no CPU.

## 11. Trust Boundaries

| ID | Frontera | Controles principales |
|---|---|---|
| TB-1 | Internet/Navegador ↔ Edge | TLS, WAF, rate limiting, CSP, validación de entrada |
| TB-2 | Edge ↔ API | Authn OIDC, autorización por solicitud, límite de tamaño, CSRF/CORS |
| TB-3 | API/Worker ↔ PostgreSQL | Roles mínimos, RLS `FORCE`, conexiones TLS, auditoría |
| TB-4 | App ↔ KMS/Secrets | Credenciales de identidad de carga de trabajo; DEK en memoria efímera |
| TB-5 | App ↔ Proveedores de IA | DLP, matriz de egress, Egress Proxy, claves por proveedor |
| TB-6 | Agente/LLM ↔ Dominio (herramientas) | Tool Registry, scopes, validación de parámetros, gates humanos |
| TB-7 | Worker ↔ Sandbox (Etapa 4) | Aislamiento, TTL, red en allowlist, sin secretos |
| TB-8 | Tenant ↔ Tenant / Grupo ↔ Grupo | RLS, ABAC, pruebas adversariales |

DFD con fronteras: [diagrams/dfd.md](diagrams/dfd.md); análisis STRIDE: [09 §4](09-Security-Privacy.md).

## 12. Evolución y extracción de servicios

| Candidato | Disparador | Qué cambia | Qué NO debe cambiar |
|---|---|---|---|
| AI Orchestration (gateway) | Escala/aislamiento de egress, múltiples consumidores | Se despliega aparte; mismo `LLMProvider` | Contratos, política DLP |
| Agent Execution | Carga larga de tareas; Temporal/Sandbox | Nuevo runtime de workflows | `TaskStore`, gates, contratos de herramientas |
| Identity Vault | Perfiles individuales (Etapa 4) o mandato legal | Servicio con BD y KMS propios | `student_ref` y API del vault |
| Documents/Render | Carga de export | Worker dedicado | `DocumentRenderer` |

## 13. Decisiones pendientes y trazabilidad

ADR relevantes: ADR-001..003, 007..012, 020. Abiertas: ubicación de `Group` (OD-12), IdP/nube (OD-04/10), residencia (OD-03). Cualquier cambio en §5 debe reflejarse en la matriz de dependencias del verificador (NFR-MNT-01).

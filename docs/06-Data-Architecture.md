# 06 — Data Architecture & Knowledge Graph

**Versión:** 0.1-draft · **Estado:** Draft (modelo lógico **propuesto**; no es un esquema final) · **Fecha:** 2026-11-22
**Dependencias:** [03](03-Domain-Model-Pedagogy.md), [04 §9](04-Software-Architecture.md), ADR-002/003/004/006/018/020 · **Alimenta:** [08](08-Concurrency-Consistency.md), [09](09-Security-Privacy.md)
**Decisiones pendientes:** OD-03 (retención, residencia), OD-05 (perfiles individuales), OD-10 (proveedor de BD y extensiones), OD-12 (ubicación de `Group`)

> Los fragmentos SQL son **ilustrativos** (contratos de constraints), no un esquema ejecutable. Sin PII real: todos los ejemplos son sintéticos.

## 1. Principios

1. **Fuente de verdad relacional;** el grafo, los embeddings y los resúmenes son **derivados reconstruibles**.
2. **Tenant isolation por construcción:** `tenant_id` en toda fila de tenant + RLS `FORCE` (INV-05).
3. **Inmutabilidad donde importa:** `artifact_version`, `decision_event`, `audit_log` son append-only (INV-01, INV-07).
4. **Identidad separada del perfil pedagógico:** `student_ref` opaco; nombres solo en `vault` cifrados con AEAD (INV-06).
5. **Procedencia y temporalidad explícitas** en memoria y grafo (DAT-02, DAT-04).
6. **Mínimo dato necesario:** sin diagnósticos; sin datos sensibles en texto libre sin DLP.
7. **PK = UUIDv7** (ordenable por tiempo); `row_version bigint` para OCC en mutables (DAT-01).

## 2. Modelo conceptual (ERD)

Diagramas: [diagrams/erd-core.md](diagrams/erd-core.md) (dominio), [diagrams/erd-memory-graph-agents.md](diagrams/erd-memory-graph-agents.md) (memoria, grafo, IA y agentes).

Relaciones fundamentales: `Tenant 1—* Membership *—1 User`; `Tenant 1—* Group`; `Group *—* Student(student_ref)` vía `GroupMembership`; `Student 1—1 StudentIdentity (vault)`; `Group 1—* LessonPlan`; `LessonPlan 1—* PlanSection 1—* ArtifactVersion`; `PlanSection 1—* Approval` (sobre versiones); `LessonPlan 1—* Patch`; `LessonPlan 1—* DecisionEvent`; `Group 1—* MemoryFact 1—* MemoryEvidence`; `CurriculumVersion 1—* LearningOutcome/Rule/PlanTemplate`; `GraphNode *—* GraphEdge`; `Agent 1—* Task 1—* Execution`.

## 3. Diccionario de datos (modelo lógico)

Convenciones: `PK`, `FK→`, `UQ`, `NN` (not null), `CK` (check). Columnas comunes en tablas de tenant: `id uuid PK`, `tenant_id uuid NN FK→iam.tenant`, `created_at timestamptz NN`, `created_by uuid FK→iam.user` (nullable para sistema), y `row_version bigint NN` si es mutable.

### 3.1 Identity & Access (`iam`, `vault`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **Tenant** (`iam.tenant`) | `id`, `kind {individual, institution}`, `name`, `status {active, suspended, closing}`, `region`, `retention_policy_id`, `row_version` | `UQ(slug)`; `kind` inmutable |
| **User** (`iam.user`) | `id`, `idp_subject NN`, `display_name`, `locale`, `status`, `row_version` | `UQ(idp_subject)`; sin datos de menores |
| **Teacher** (`iam.teacher_profile`) | `user_id PK/FK→user`, `style_notes_ref`, `subjects[]`, `levels[]`, `preferences_ref` | Perfil del docente; preferencias persistentes viven en `MemoryFact` |
| **Role** (`iam.role`) | `id`, `code {teacher, coordinator, tenant_admin, auditor, ...}`, `permissions jsonb` | Catálogo; `UQ(code)` |
| **Membership** (`iam.membership`) | `id`, `tenant_id`, `user_id`, `role_id`, `status {active, revoked}`, `authz_version bigint`, `valid_from`, `valid_to` | `UQ(tenant_id, user_id, role_id)`; revocar incrementa `authz_version` (FR-IAM-06) |
| **Grant** (`iam.grant`) | `id`, `tenant_id`, `grantee_user_id`, `resource_type`, `resource_id`, `purpose`, `scope`, `expires_at`, `revoked_at` | Concesión explícita (FR-IAM-04) |
| **Student** (`iam.student`) | `student_ref uuid PK` (aleatorio, **no** derivado del nombre), `tenant_id`, `status`, `created_at` | **Sin atributos personales**; `UQ(tenant_id, student_ref)` |
| **StudentIdentity** (`vault.student_identity`) | `student_ref PK/FK→iam.student`, `tenant_id`, `ciphertext bytea NN`, `nonce bytea NN`, `aead_alg`, `dek_id NN`, `schema_version`, `created_at` | AEAD con **AAD = tenant_id ‖ student_ref ‖ schema_version**; sin índices sobre contenido; ver §6 |
| **AuditLog** (`iam.audit_log`) | `id`, `tenant_id`, `actor_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `purpose`, `outcome`, `trace_id`, `occurred_at`, `prev_hash`, `entry_hash` | Append-only; hash encadenado (SHOULD); sin PII |

### 3.2 Curriculum (`cur`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **CurriculumSource** | `id`, `publisher`, `title`, `url`, `doc_version`, `retrieved_at`, `file_hash`, `effective_from`, `effective_to`, `validation_status {unvalidated, expert_validated}`, `validated_by`, `validated_at` | `UQ(url, file_hash)` |
| **CurriculumVersion** | `id`, `label`, `status {draft, published, retired}`, `published_at`, `school_year` | Publicada = inmutable (INV-12) |
| **LearningOutcome** | `id`, `curriculum_version_id FK`, `subject`, `level`, `cycle`, `code`, `text`, `source_ref {source_id, section}` | `UQ(curriculum_version_id, subject, level, code)` |
| **CurriculumRule** | `id`, `curriculum_version_id FK`, `source_id FK`, `source_version`, `effective_from`, `education_level`, `modality`, `subject`, `rule_type`, `rule_class`, `severity`, `validator_id`, `human_explanation`, `exceptions jsonb` | `CK(rule_class IN (...))`; no se publica sin `source_id` |
| **PlanTemplate** | `id`, `curriculum_version_id`, `subject`, `modality`, `level`, `structure jsonb` (secciones, campos), `source_ref` | Versionada |

### 3.3 Planning & Documents (`pln`, `doc`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **LessonPlan** | `id`, `tenant_id`, `owner_user_id`, `group_id FK`, `subject`, `period`, `curriculum_version_id FK`, `template_id FK`, `state {idea, draft, in_review, partially_approved, approved, exported, implemented, reflected}`, `visibility {private, shared}`, `row_version` | `state` derivado para `partially_approved/approved`; CK de transiciones vía trigger |
| **PlanSection** | `id`, `plan_id FK`, `kind`, `position`, `title`, `state {draft, proposed, approved, reopened}`, `current_version_id FK→doc.artifact_version`, `approved_version_id FK NULL`, `row_version` | `CK(state<>'approved' OR approved_version_id IS NOT NULL)`; `CK(approved_version_id IS NULL OR approved_version_id = current_version_id OR state='reopened')` |
| **SectionLink** | `id`, `plan_id`, `from_section_id`, `to_section_id`, `link_type {supports, evidences, references_annex, assesses, depends_on}` | `UQ(from, to, link_type)`; ambos extremos del mismo `plan_id` |
| **ArtifactVersion** (`doc.artifact_version`) | `id`, `tenant_id`, `artifact_id`, `artifact_type {plan_section, plan_snapshot, export}`, `version_no`, `content jsonb NN`, `content_hash char(64) NN`, `parent_version_id FK`, `authorship {teacher, assistant_accepted, import}`, `status {current, superseded}`, `created_by`, `created_at` | **Inmutable** (sin UPDATE de `content`/`hash`); `UQ(artifact_id, version_no)`; `status` solo cambia current→superseded |
| **Patch** | `id`, `plan_id`, `section_id`, `base_version_id FK`, `proposed_content jsonb`, `diff jsonb`, `impact jsonb`, `status {pending, accepted, rejected, stale, withdrawn}`, `proposed_by_actor_type {teacher, assistant}`, `task_id NULL`, `step_key NULL`, `row_version` | `UQ(task_id, step_key)` (idempotencia de agentes) |
| **Approval** | `id`, `tenant_id`, `section_id`, `artifact_version_id FK NN`, `approver_user_id FK NN`, `actor_type CK='teacher'`, `scope`, `attestation_text_ref`, `decided_at`, `status {active, superseded, revoked}` | **Índice único parcial** `(artifact_version_id) WHERE status='active'` (INV-11) |
| **Reflection** | `id`, `plan_id`, `section_id NULL`, `group_id`, `applied_on date`, `observation_text`, `kind {observation, barrier, suggestion}`, `evidence_kind {real, simulated_example}` | Genera `MemoryEvidence` candidata |
| **ExportJob** (`doc.export_job`) | `id`, `plan_id`, `requested_by`, `versions jsonb` (mapa sección→versión), `format`, `status {queued, rendering, stored, failed}`, `object_key`, `content_hash`, `attestation_id`, `row_version` | `UQ(idempotency)` |

### 3.4 Memory (`mem`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **Group** | `id`, `tenant_id`, `owner_user_id`, `name`, `grade`, `subject_scope[]`, `period`, `status {active, closed}`, `size_band` | Aislamiento por grupo (INV-08); `UQ(tenant_id, owner, name, period)` |
| **GroupMembership** | `group_id`, `student_ref FK→iam.student`, `valid_from`, `valid_to` | `PK(group_id, student_ref, valid_from)` |
| **PedagogicalProfile** | `id`, `tenant_id`, `subject_kind {group, student}`, `group_id`, `student_ref NULL`, `summary_ref`, `status` | `student` deshabilitado por flag (FR-STU-03); sin diagnósticos |
| **Conversation** | `id`, `tenant_id`, `owner_user_id`, `plan_id NULL`, `group_id NULL`, `status`, `retention_until` | |
| **ConversationTurn** | `id`, `conversation_id`, `seq`, `role {teacher, assistant, system}`, `intent`, `content_ref`/`content text`, `section_id NULL`, `plan_version_ref`, `model_call_id NULL`, `pii_classification` | `UQ(conversation_id, seq)`; contenido pasa DLP de salida antes de persistirse si proviene del modelo |
| **DecisionEvent** | `event_id`, `tenant_id`, `teacher_id`, `plan_id`, `section_id`, `event_type`, `prior_version`, `new_version`, `decision_source {teacher, assistant, institution, system}`, `teacher_confirmation bool`, `rationale`, `provenance_ref`, `pii_classification {none, teacher_content, group_context}`, `occurred_at` (expuesto como `timestamp` en el contrato y en FR-MEM-01), `prev_hash` | **Append-only**; `CK(event_type IN ('accept_patch','reject_patch','approve_block','reopen_block','request_export') ⇒ decision_source='teacher' ∧ teacher_confirmation)`; contrato: [decision-event.schema.json](contracts/schemas/decision-event.schema.json) |
| **MemoryFact** | `id`, `tenant_id`, `scope {teacher, group, plan, institution}`, `scope_ref`, `predicate_key`, `statement jsonb/text`, `condition {observado, preferencia_confirmada, inferencia_por_confirmar}`, `status {candidate, confirmed, review_required, rejected, expired, superseded, retracted}`, `confidence`, `audience`, `valid_from`, `valid_to`, `recorded_at`, `expires_at`, `origin_actor_type`, `confirmed_by`, `confirmed_at`, `derived_from`, `row_version` | `CK(status<>'confirmed' OR (confirmed_by IS NOT NULL AND origin evidence ≥ 1))` (trigger deferrable); `UQ` parcial `(tenant_id, scope, scope_ref, predicate_key) WHERE status='confirmed' AND valid_to IS NULL` |
| **MemoryEvidence** | `id`, `fact_id FK`, `evidence_type {decision_event, reflection, conversation_turn, document, observation}`, `evidence_ref`, `captured_at`, `captured_by` | Referencia, no copia contenido sensible |

### 3.5 Knowledge Graph (`kg`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **GraphNode** | `id`, `scope {public_curriculum, private_pedagogical}`, `tenant_id NULL`, `node_type`, `ref_schema`, `ref_id`, `props jsonb`, `valid_from`, `valid_to`, `provenance_ref`, `status`, `derived_from`, `row_version` | `CK((scope='public_curriculum' AND tenant_id IS NULL) OR (scope='private_pedagogical' AND tenant_id IS NOT NULL))`; particionada por `scope` |
| **GraphEdge** | `id`, `scope`, `tenant_id NULL`, `from_node_id`, `to_node_id`, `edge_type`, `props jsonb`, `valid_from`, `valid_to`, `provenance_ref NN`, `confidence`, `status`, `derived_from`, `row_version` | **Prohibido** `from` público → `to` privado (CK vía trigger); `EXCLUDE USING gist (from, to, edge_type WITH =, tstzrange(valid_from, valid_to) WITH &&)` |

### 3.6 AI & Agents (`aio`, `agx`)

| Entidad | Columnas clave | Constraints / notas |
|---|---|---|
| **ModelCall** (`aio.model_call`) | `id`, `tenant_id`, `user_id`, `task_id NULL`, `provider`, `model_alias`, `routing_policy_id`, `data_classes_sent[]`, `egress_decision`, `tokens_in`, `tokens_out`, `cost_estimate`, `latency_ms`, `outcome`, `context_manifest_id`, `prompt_version`, `trace_id` | **Sin contenido** de prompts/respuestas; solo metadatos |
| **ContextManifest** | `id`, `tenant_id`, `purpose`, `items jsonb` (`{ref, kind, version, reason, class, token_est}`), `excluded jsonb`, `created_at` | Referencias y hashes, no PII (FR-AIO-02) |
| **Agent** (`agx.agent`) | `id`, `tenant_id`, `kind {personal, group, specialist, institution}`, `owner_user_id`, `group_id NULL`, `tool_allowlist_ref`, `policy_ref`, `status`, `row_version` | Groupbot: `group_id NN`, `CK(kind<>'group' OR group_id IS NOT NULL)` |
| **Task** | `id`, `tenant_id`, `agent_id`, `requested_by`, `type`, `state`, `plan_id NULL`, `input_ref`, `idempotency_key`, `authz_version_snapshot`, `deadline`, `attempt`, `lease_owner`, `lease_expires_at`, `fencing_token`, `budget jsonb`, `parent_task_id`, `row_version` | `UQ(tenant_id, idempotency_key)`; máquina de estados en 07 §4 |
| **Execution** | `id`, `task_id`, `attempt_no`, `runtime {inline, worker, sandbox}`, `started_at`, `ended_at`, `outcome`, `checkpoint_ref`, `cost`, `trace_id`, `sandbox_id NULL` | `UQ(task_id, attempt_no)` |
| **ToolInvocation** | `id`, `execution_id`, `step_key`, `tool_name`, `scopes_used[]`, `args_hash`, `outcome`, `approval_gate_id NULL`, `occurred_at` | `UQ(execution_id, step_key)`; sin argumentos en claro si contienen datos sensibles |
| **ApprovalGate** | `id`, `task_id`, `action`, `requested_at`, `resolved_by`, `resolution {approved, rejected, expired}`, `resolved_at` | Solo humano con rol adecuado |

### 3.7 Plataforma (`plt`)

| Entidad | Columnas clave | Notas |
|---|---|---|
| **OutboxEvent** | `id` (= `event_id`), `tenant_id`, `type`, `payload jsonb`, `occurred_at`, `published_at NULL`, `attempts` | Insertado en la **misma tx** que el cambio; relay marca publicado |
| **ProcessedEvent** | `consumer`, `event_id`, `processed_at` | `PK(consumer, event_id)` — dedup |
| **IdempotencyKey** | `tenant_id`, `key`, `request_hash`, `response`, `status`, `expires_at` | `PK(tenant_id, key)` |

## 4. Claves y restricciones (PK/FK/UQ) y integridad referencial

- **PK:** `id uuid` (UUIDv7) en toda entidad; claves compuestas solo en tablas puente.
- **FK:** dentro de un esquema son reales (`ON DELETE RESTRICT` por defecto). **Entre esquemas de contextos distintos** se usa FK real solo hacia `iam.tenant` y `iam.user` (kernel); las demás referencias interesquema (`plan_id`↔`mem.decision_event`, `doc.artifact_version`↔`pln.plan_section`) son FK reales permitidas **solo** donde exista dependencia declarada en la matriz 04 §5.2 y escritura por el módulo dueño; el resto son *soft references* validadas en la aplicación.
- **UQ relevantes:** `(tenant_id, user_id, role_id)`; `(artifact_id, version_no)`; `(task_id, step_key)`; `(tenant_id, idempotency_key)`; `(consumer, event_id)`; índice parcial de `Approval` activa; índice parcial de `MemoryFact` confirmada vigente.
- **CK/Triggers de invariante:**
  - INV-01: trigger `BEFORE UPDATE` en `pln.plan_section` rechaza cambio de `current_version_id` si `state='approved'`; trigger en `doc.artifact_version` rechaza UPDATE de `content/content_hash`.
  - INV-02: `Approval.actor_type = 'teacher'` + verificación de rol en servicio y función `SECURITY INVOKER`.
  - INV-03/04: trigger deferrable en `mem.memory_fact` que exige confirmación docente y ≥1 evidencia para `confirmed`.
  - INV-07: `REVOKE UPDATE, DELETE` sobre `decision_event` y `audit_log` al rol de aplicación.
  - INV-08: trigger que rechaza arista público→privado; `tenant_id` consistente entre nodos y arista.

```sql
-- ILUSTRATIVO: Approval única y activa por versión (INV-11)
CREATE UNIQUE INDEX approval_one_active ON pln.approval (artifact_version_id) WHERE status = 'active';

-- ILUSTRATIVO: validez temporal sin solapamiento (DAT-02)
ALTER TABLE kg.graph_edge ADD CONSTRAINT edge_no_overlap
  EXCLUDE USING gist (from_node_id WITH =, to_node_id WITH =, edge_type WITH =,
                      tstzrange(valid_from, valid_to) WITH &&);
```

## 5. Aislamiento de tenants (RLS) — INV-05, SPR-01, ADR-020

- Cada transacción establece el contexto: `SET LOCAL app.tenant_id = :tenant; SET LOCAL app.user_id = :user;` desde el token/membresía (nunca del cliente).
- Política tipo en toda tabla de tenant, con `ALTER TABLE ... FORCE ROW LEVEL SECURITY`:

```sql
-- ILUSTRATIVO
CREATE POLICY tenant_isolation ON pln.lesson_plan
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

- **Defensa en profundidad:** RLS aísla por tenant; el **PDP (ABAC)** aísla por propietario/grupo/propósito dentro del tenant (un coordinador no ve planes privados de un docente aunque compartan tenant); consultas de aplicación sin contexto de tenant fallan (sin valor por defecto).
- **Roles:** la aplicación usa `app_rw` sin `BYPASSRLS` y sin propiedad de tablas; migraciones con `migrator`; funciones `SECURITY DEFINER` prohibidas salvo lista revisada.
- **Prueba:** un test enumera todas las tablas y exige política RLS + `FORCE` (excepciones explícitas: `cur.*` y partición pública del grafo).

## 6. Identidad estudiantil: bóveda — FR-STU-01/02, INV-06, ADR-006

- **Separación:** `iam.student` (solo `student_ref`) ≠ `vault.student_identity` (nombre y datos identificatorios, cifrados). El perfil pedagógico y todo `mem.*`/`kg.*` referencian únicamente `student_ref`.
- **Identificador opaco:** `student_ref` = 128 bits aleatorios (CSPRNG). **No** se deriva del nombre ni de ningún atributo; **no** existe columna de hash del nombre ni índice de búsqueda por nombre (un hash simple es reversible por diccionario y no sustituye la autorización).
- **Cifrado:** AEAD (algoritmo concreto a confirmar, OD-10) con **clave de datos (DEK) por tenant** envuelta por una **KEK** en KMS/HSM; `AAD = tenant_id ‖ student_ref ‖ schema_version` para ligar el ciphertext a su contexto; nonce único por cifrado; rotación de KEK sin re-cifrar datos (re-envuelve DEK); re-cifrado perezoso de DEK.
- **Acceso:** solo `VaultService` (rol `vault_rw`) en la capa de presentación del servidor para mostrar nombres al docente autorizado; cada lectura genera `audit_log` con propósito. **Ningún** agente, herramienta MCP ni llamada a LLM tiene ruta hacia el vault (FR-STU-02).
- **Búsqueda:** no hay búsqueda global por nombre en MVP; el docente trabaja dentro del roster de su grupo, que se descifra en memoria efímera (tamaño pequeño).
- **Borrado:** *crypto-shredding* — destruir la DEK del tenant/estudiante hace irrecuperable el ciphertext, incluso en backups (DAT-03).
- **Reidentificación por inferencia:** los hechos de memoria **no** pueden contener nombres; DLP bloquea datos identificatorios en texto libre (07 §9); grupos con `size_band` muy pequeño se agregan para evitar singularización (regla de k-anonimato mínima, valor por decidir con legal).

## 7. Knowledge Graph — ADR-003

### 7.1 Esquema

**Dos particiones lógicas** que **no se fusionan** (INV-08):

| Scope | `tenant_id` | Contenido | Escritor | Lectores |
|---|---|---|---|---|
| `public_curriculum` | NULL | Aprendizajes, contenidos, progresiones, competencias, metodologías, materiales (con fuente/versión) | Proyector de CUR | Todos los tenants (solo lectura) |
| `private_pedagogical` | NOT NULL | Docente, grupo, plan, secciones, actividades, hechos de memoria, decisiones; estudiantes **solo** como `student_ref` y únicamente si el flag de perfiles individuales está activo | Proyector de MEM | Solo el tenant, filtrado por ABAC |

**Tipos de nodo (propuestos):** `Outcome, Content, Competency, Methodology, Template` (público); `Teacher, Group, Plan, Section, Activity, Annex, Indicator, MemoryFact, Decision, Reflection` (privado). **Tipos de arista:** `ALIGNS_TO` (privado→público), `SUPPORTS`, `EVIDENCES`, `REFERENCES_ANNEX`, `DERIVED_FROM`, `SUPERSEDES`, `OBSERVED_IN`, `PREFERS`. Aristas con `valid_from/valid_to`, `provenance_ref` obligatoria, `confidence` y `status`.

Ejemplo (sintético): `Group(4-A ficticio) —PREFERS→ MemoryFact(juegos de asociación) [valid 2026-03..2026-12, provenance: Reflection#…, status confirmed]`; `Activity(Geometrópolis) —ALIGNS_TO→ Outcome(área y perímetro…)`.

### 7.2 Proyección y consistencia
El grafo se **proyecta** desde eventos (`PatchAccepted`, `SectionApproved`, `MemoryFactConfirmed/Retracted`, `CurriculumVersionPublished`) mediante consumidores idempotentes; se puede **reconstruir** desde la fuente de verdad. Una arista derivada guarda `derived_from` para invalidación en cascada (DAT-04, FR-MEM-04).

### 7.3 Recuperación con conciencia de autorización (*authorization-aware retrieval*)
Los agentes **no** consultan el grafo directamente. `GraphAccessService`:
1. Recibe una **petición tipada** (`start_nodes`, `edge_types`, `max_depth ≤ 3`, `purpose`, `as_of`), nunca SQL/Cypher libre.
2. Aplica **RLS** (tenant), **ABAC** (propietario/grupo/propósito/audiencia) y filtros de **vigencia** (`valid_from ≤ as_of < valid_to`), `status`, y `confidence ≥ umbral`.
3. Limita profundidad y cardinalidad; excluye nodos/aristas fuera de la audiencia **antes** de ensamblar el contexto.
4. Devuelve DTOs con `provenance` y `reason`, y registra el acceso (auditoría de lectura sensible).
5. Prohíbe recorridos que crucen grupos no autorizados (INV-08).

## 8. Datos temporales y procedencia

- **Bitemporalidad mínima:** `valid_from/valid_to` (cuándo es verdad) y `recorded_at` (cuándo se registró). Las correcciones **cierran** la validez anterior y crean un registro nuevo (`superseded`), no sobrescriben.
- **Procedencia:** cada `MemoryFact`/arista referencia `MemoryEvidence`/`provenance_ref` (evento, reflexión, turno, documento). Cada `ArtifactVersion` registra `authorship` (`teacher`/`assistant_accepted`/`import`). Los datos derivados registran `derived_from`.
- **Clases de condición** (S06): `observado`, `preferencia_confirmada`, `inferencia_por_confirmar`; la IA solo genera la última (FR-MEM-03).
- **Hash de contenido** (`content_hash`) detecta alteraciones, **no** sustituye autorización (S07).

## 9. Estrategia de indexación

| Tabla | Índice | Propósito |
|---|---|---|
| Todas las de tenant | `(tenant_id, id)` + índices con `tenant_id` como primera columna | RLS eficiente |
| `pln.lesson_plan` | `(tenant_id, owner_user_id, state, updated_at DESC)`; `(group_id)` | Listados |
| `pln.plan_section` | `(plan_id, position)`; `(plan_id, state)` | Estructura y estado |
| `pln.section_link` | `(plan_id, from_section_id)`, `(plan_id, to_section_id)` | Impacto |
| `doc.artifact_version` | `UQ(artifact_id, version_no)`; `(content_hash)` | Historial y verificación |
| `pln.patch` | `(plan_id, status)`; `UQ(task_id, step_key) WHERE task_id IS NOT NULL` | Pendientes e idempotencia |
| `mem.decision_event` | `(tenant_id, plan_id, occurred_at)`; BRIN en `occurred_at` | Cronología |
| `mem.memory_fact` | `UQ parcial (scope, scope_ref, predicate_key) WHERE confirmed AND valid_to IS NULL`; `(tenant_id, scope, scope_ref, status)`; índice vectorial HNSW/IVFFlat sobre embeddings **sin PII**; GIN sobre `statement` si es JSONB | Recuperación |
| `kg.graph_node/edge` | `(scope, tenant_id, node_type)`, `(from_node_id, edge_type)`, `(to_node_id, edge_type)`, GiST temporal | Recorridos acotados |
| `agx.task` | `(state, lease_expires_at) WHERE state IN ('queued','retry_wait')` | Poll del worker (`SKIP LOCKED`) |
| `plt.outbox_event` | `(published_at) WHERE published_at IS NULL` | Relay |
| `iam.audit_log` | `(tenant_id, occurred_at)`; BRIN | Auditoría |

Particionamiento por tiempo para `decision_event`, `audit_log`, `model_call` cuando el volumen lo justifique (medir).

## 10. Ciclo de vida de datos, borrado y retención

| Clase de dato | Borrado | Retención por defecto (**provisional; OD-03**) | Notas |
|---|---|---|---|
| Plan, secciones, versiones, aprobaciones | **Soft delete** (`deleted_at`), hard delete a petición/tras retención | Mientras exista la cuenta + período a definir | Versiones inmutables; borrar plan borra versiones al vencer retención |
| `decision_event`, `audit_log` | **Sin delete** en uso normal (append-only); expiran por política vía partición/archivo | A definir con legal | Sin PII; el docente puede pedir anonimización del `rationale` |
| `MemoryFact`/`MemoryEvidence` | Rectificación/retractación inmediata; **hard delete** a solicitud | Hasta caducidad del periodo/grupo | Invalida derivados ≤ 24 h (FR-MEM-04) |
| Conversaciones | Soft delete; retención configurable | A definir | Resúmenes derivados revocables |
| Embeddings/resúmenes | **Hard delete** al invalidar origen | Igual que el origen | |
| `student_identity` | **Hard delete + crypto-shredding** | Mientras el grupo esté activo + plazo legal | Se elimina al cerrar relación |
| Grafo privado | Reconstruible; aristas con `status` | Igual que el origen | |
| Exports/objetos | Versionados; expiración por política | A definir | Cifrado en reposo |
| Logs/trazas | Sin PII; retención corta | 30–90 días *(provisional)* | |
| Backups | Cifrados; ventana acotada | RPO/RTO en NFR-REL-01 | El borrado se propaga a backups por expiración y crypto-shredding |

**Cierre de periodo/año (FR-MEM-10):** hechos del grupo pasan a `review_required`; grupos a `closed`; opciones: archivar, exportar al docente, eliminar. **Portabilidad (NFR-PORT-01):** exportación completa en JSON abierto + DOCX/PDF.

## 11. Auditoría y trazabilidad

- **`decision_event`:** historia pedagógica (qué se propuso/aceptó/aprobó/reabrió). Hash encadenado por plan (`prev_hash`) como control de integridad adicional *(SHOULD)*.
- **`audit_log`:** accesos privilegiados (vault, exports, permisos, borrados, herramientas de agentes, lecturas sensibles del grafo). Sin PII; incluye `purpose`, `trace_id`.
- Ambos: **append-only**, permisos de BD sin UPDATE/DELETE para la aplicación, copia periódica a almacenamiento inmutable *(SHOULD)*.
- **Ledger de contribuciones:** `ArtifactVersion.authorship` permite distinguir texto escrito por el docente de texto propuesto por IA y aceptado (FR-PLN-15).

## 12. Decisiones pendientes
OD-03 (retención y residencia), OD-05 (perfiles individuales; k mínimo de agregación), OD-10 (extensiones disponibles en el proveedor; algoritmo AEAD), OD-12 (`Group` en MEM vs contexto Roster; `superseded`).

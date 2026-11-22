# Interfaces tipadas (puertos)

**Versión:** 0.1-draft · **Estado:** Proposed · **Fuente:** [05 §12](../05-Technical-Specifications.md), [07](../07-AI-Agentic-Architecture.md)

Firmas **ilustrativas** en TypeScript de los puertos entre el dominio y los adaptadores. No hay implementación. Los tipos de datos compartidos corresponden a los JSON Schema de [schemas/](schemas/).

## Tipos comunes

```ts
type UUID = string;
type DataClass = "C0" | "C1" | "C2" | "C3";            // C4 (identidad) nunca cruza un puerto hacia IA
type ProviderTier = "T0" | "T1" | "T2";                 // 07 §9.3
type Purpose =
  | "draft_section" | "selective_revision" | "annex"
  | "indicators" | "explain_findings" | "memory_consolidation";

interface Actor {
  userId: UUID;
  tenantId: UUID;
  actorType: "teacher" | "coordinator" | "tenant_admin" | "assistant" | "system";
  authzVersion: number;                                  // para detectar revocación (FR-IAM-06)
}

type DomainError =
  | { kind: "Forbidden" } | { kind: "NotFound" }
  | { kind: "Conflict"; code: "section-approved" | "patch-stale" | "version-mismatch" }
  | { kind: "PreconditionFailed"; currentEtag: string }
  | { kind: "ValidationFailed"; errors: { pointer: string; message: string }[] };
```

## `LLMProvider` (EIR-01, FR-AIO-01)

```ts
interface ProviderDataPolicy {
  tier: ProviderTier;
  trainsOnCustomerData: boolean;
  retention: string;                                     // según contrato del proveedor
  region: string;
}

interface ModelCapabilities {
  maxContextTokens: number;
  structuredOutput: boolean;
  toolCalling: boolean;
  streaming: boolean;
}

interface CompletionRequest {
  modelAlias: string;
  system: string;                                        // instrucciones versionadas
  messages: { role: "user" | "assistant"; content: string }[];
  untrustedContent: { label: string; text: string }[];  // delimitado como datos (SPR-04)
  outputSchema?: object;                                 // JSON Schema esperado
  maxOutputTokens: number;
  deadlineMs: number;
  dataClasses: DataClass[];                              // el gateway verifica contra policy.tier
}

type ProviderError =
  | { kind: "ProviderUnavailable" } | { kind: "RateLimited"; retryAfterMs?: number }
  | { kind: "Timeout" } | { kind: "ContentFiltered" } | { kind: "InvalidOutput" };

interface LLMProvider {
  readonly id: string;
  capabilities(modelAlias: string): ModelCapabilities;
  dataPolicy(): ProviderDataPolicy;
  complete(req: CompletionRequest): Promise<{ text: string; tokensIn: number; tokensOut: number } | ProviderError>;
  stream(req: CompletionRequest): AsyncIterable<{ delta: string } | ProviderError>;
  embed(texts: string[], modelAlias: string): Promise<{ vectors: number[][] } | ProviderError>;
}
```

## `MemoryRetrieval` (FR-MEM-05, FR-MEM-06)

```ts
interface RetrievalQuery {
  purpose: Purpose;
  scope: { teacherId?: UUID; groupId?: UUID; planId?: UUID };
  text?: string;
  asOf: string;                                          // ISO 8601; filtra validez temporal
  limit: number;
  excludeFactIds?: UUID[];                               // exclusión por el docente (FR-PLN-13)
}

interface ContextItem {
  kind: "curriculum_rule" | "learning_outcome" | "approved_section" | "target_section" | "memory_fact" | "resource";
  ref: UUID;
  version?: string;
  truthLevel: 1 | 2 | 3 | 4 | 5;                         // BR-01
  dataClass: DataClass;
  provenance: { evidenceType: string; evidenceRef: UUID }[];
  reason: string;                                        // «por qué recordé esto»
  text: string;
}

interface MemoryRetrieval {
  // Aplica tenant, grupo, audiencia, vigencia y propósito ANTES de devolver.
  retrieve(query: RetrievalQuery, actor: Actor): Promise<ContextItem[] | DomainError>;
}
```

## `ToolRegistry` (FR-AGX-02, FR-AGX-05)

```ts
interface ToolContract {                                 // ver mcp-tools/*.json
  name: string;
  requiredScopes: string[];
  sideEffects: "none" | "creates_pending_proposal";
  dataClassMax: DataClass;
  requiresApproval: boolean;
  inputSchema: object;
  outputSchema: object;
}

interface ToolCall {
  agentId: UUID;
  taskId: UUID;
  stepKey: string;                                       // idempotencia (task_id, step_key)
  tool: string;
  args: unknown;
  onBehalfOf: Actor;                                     // siempre el docente solicitante
}

interface ToolRegistry {
  register(contract: ToolContract): void;                // revisión humana previa
  list(agentId: UUID): ToolContract[];                   // solo la allowlist del agente
  invoke(call: ToolCall): Promise<{ output: unknown } | DomainError>;
}
```

## `AgentRuntime` y `TaskStore` (FR-AGX-01, FR-AGX-07, ADR-008)

```ts
type TaskState =
  | "queued" | "leased" | "running" | "awaiting_approval" | "retry_wait"
  | "succeeded" | "failed" | "dead_lettered" | "cancelled" | "expired";

interface Lease { taskId: UUID; owner: string; fencingToken: number; expiresAt: string }

interface TaskStore {
  enqueue(task: { type: string; agentId: UUID; input: unknown; idempotencyKey: string; deadline: string }, actor: Actor): Promise<UUID>;
  lease(workerId: string, types: string[]): Promise<Lease | null>;
  transition(lease: Lease, from: TaskState, to: TaskState, cause?: string): Promise<boolean>; // CAS + fencing
  checkpoint(lease: Lease, stepKey: string, resultRef: string): Promise<boolean>;
}

interface AgentRuntime {
  submit(task: { type: string; input: unknown }, actor: Actor): Promise<UUID>;
  resume(taskId: UUID): Promise<void>;
  cancel(taskId: UUID, actor: Actor): Promise<void>;
  requestApproval(taskId: UUID, action: string, expiresAt: string): Promise<UUID>; // ApprovalGate
}
```

## `DocumentRenderer` (EIR-03, ADR-023)

```ts
interface RenderModel {
  planId: UUID;
  templateId: UUID;
  sections: { sectionId: UUID; versionId: UUID; contentHash: string; content: unknown }[];
  audience: "teacher_plan" | "student_material" | "teacher_solutions";
}

interface DocumentRenderer {
  // Determinista: misma entrada y plantilla → mismo contentHash.
  render(model: RenderModel, format: "docx" | "pdf" | "html"): Promise<{ bytes: Uint8Array; contentHash: string }>;
}
```

## Otros puertos

```ts
interface AuthorizationPort {
  check(actor: Actor, action: string, resource: { type: string; id: UUID }, purpose?: Purpose): Promise<boolean>;
}

interface DecisionLog {
  append(event: object /* decision-event.schema.json */, tx: unknown): Promise<void>; // misma transacción
}

interface KeyService {
  wrapDek(tenantId: UUID, dek: Uint8Array): Promise<{ wrapped: Uint8Array; kekRef: string }>;
  unwrapDek(tenantId: UUID, wrapped: Uint8Array, kekRef: string): Promise<Uint8Array>;
  rotateKek(tenantId: UUID): Promise<void>;              // nunca expone la KEK
}
```

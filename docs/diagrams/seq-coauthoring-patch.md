# Sequence — Coautoría: revisión selectiva, aceptación y aprobación

Fuente: [01 §7.1](../01-PRD.md), [03 §3](../03-Domain-Model-Pedagogy.md), [07 §3](../07-AI-Agentic-Architecture.md). Caso: «Dejá inicio y cierre; cambiá el desarrollo por una dinámica cooperativa».

```mermaid
sequenceDiagram
  autonumber
  actor T as Docente
  participant W as Web App
  participant A as API (PLN)
  participant S as Supervisor (worker)
  participant C as Context Assembler
  participant G as AI Gateway
  participant P as Proveedor IA
  participant DB as PostgreSQL

  T->>W: Instrucción de revisión selectiva
  W->>A: POST /plans/{id}/draft-requests (Idempotency-Key, alcance = desarrollo)
  A->>DB: Task(queued) + OutboxEvent (misma tx)
  A-->>W: 202 Accepted + Location /tasks/{tid}
  S->>DB: lease Task (fencing_token)
  S->>C: ensamblar contexto (purpose = draft_section)
  C->>DB: secciones aprobadas, reglas, hechos confirmados del grupo (RLS + ABAC)
  C-->>S: contexto minimizado + ContextManifest
  S->>G: generar propuesta (secciones congeladas = inicio, cierre)
  G->>G: DLP + egress + presupuesto
  G->>P: llamada vía Egress Proxy
  P-->>G: texto propuesto
  G->>G: validar esquema y alcance (FR-AIO-07)
  G-->>S: propuesta válida
  S->>A: plan.propose_patch(base_version_id = v3, task_id, step_key)
  A->>DB: Patch(pending) + impacto (anexo 2, indicador 3) + DecisionEvent(propose_patch)
  W-->>T: diff original vs propuesta + impacto
  T->>W: Aceptar patch
  W->>A: POST /plans/{id}/patches/{pid}/accept (If-Match, Idempotency-Key)
  A->>DB: CAS current_version = v3 y state no approved → nueva versión v4 + DecisionEvent + Outbox
  A-->>W: 200 + ETag nuevo
  T->>W: Aprobar desarrollo
  W->>A: POST /plans/{id}/sections/{sid}/approve (artifact_version_id = v4, If-Match)
  A->>DB: FOR UPDATE plan, CAS sección → approved, Approval, estado del plan derivado, DecisionEvent + Outbox
  A-->>W: 200 (inicio y cierre sin cambios: mismo hash)
```

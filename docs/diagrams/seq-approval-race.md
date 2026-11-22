# Sequence — Carrera aprobación vs modificación (R-04)

Fuente: [08 R-04](../08-Concurrency-Consistency.md). Ambas solicitudes parten de la versión v3. Solo una gana; la otra recibe `409`.

```mermaid
sequenceDiagram
  autonumber
  actor T1 as Docente (pestaña 1)
  actor T2 as Docente (pestaña 2)
  participant A as API
  participant DB as PostgreSQL

  par Aprobar v3
    T1->>A: POST approve (artifact_version_id = v3, If-Match rv7)
    A->>DB: BEGIN, SELECT lesson_plan FOR UPDATE
    A->>DB: UPDATE plan_section SET state = approved WHERE current_version_id = v3 AND state != approved AND row_version = 7
  and Aceptar patch v3 a v4
    T2->>A: POST accept patch (base = v3, If-Match rv7)
    A->>DB: BEGIN, SELECT lesson_plan FOR UPDATE (espera el lock)
  end
  DB-->>A: 1 fila (aprobación)
  A->>DB: INSERT Approval + DecisionEvent + Outbox, COMMIT
  A-->>T1: 200 aprobado (v3)
  A->>DB: UPDATE plan_section SET current_version_id = v4 WHERE current_version_id = v3 AND state != approved AND row_version = 7
  DB-->>A: 0 filas
  A->>DB: ROLLBACK
  A-->>T2: 409 section-approved
```

Resultado alternativo válido: si el patch obtiene el lock primero, v4 queda como versión actual y la aprobación de v3 recibe `409 version-mismatch` porque ya no es la versión actual. Ningún otro resultado es aceptable.

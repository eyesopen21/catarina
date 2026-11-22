# Sequence — Ensamblaje de contexto, DLP, egress y degradación

Fuente: [07 §6, §9](../07-AI-Agentic-Architecture.md).

```mermaid
sequenceDiagram
  autonumber
  participant S as Supervisor
  participant C as Context Assembler
  participant Z as PDP (IAM)
  participant M as MemoryRetrieval / GraphAccessService
  participant G as AI Gateway
  participant D as DLP + egress
  participant R as Router
  participant P1 as Proveedor principal
  participant P2 as Proveedor fallback

  S->>C: assemble(purpose, actor, plan, group)
  C->>Z: check(actor, purpose, fuentes)
  Z-->>C: fuentes permitidas
  C->>M: retrieve(query, actor, purpose, as_of)
  M-->>C: ítems con procedencia y razón (sin identidad)
  C->>C: filtrar vigencia, precedencia BR-01, minimizar, presupuesto
  C-->>S: contexto + ContextManifest
  S->>G: complete(request)
  G->>D: clasificar y redactar
  alt Clase no permitida para el nivel del proveedor
    D-->>G: egress-blocked
    G-->>S: error tipado (fail-closed)
  else Permitido
    G->>R: elegir modelo para la tarea
    R->>P1: llamada (timeout del presupuesto restante)
    alt Éxito
      P1-->>R: respuesta
    else Falla o circuit breaker abierto
      R->>P2: fallback con nivel de protección igual o superior
      P2-->>R: respuesta
    end
    R-->>G: respuesta
    G->>G: validar esquema, DLP de salida, registrar ModelCall (sin contenido)
    G-->>S: salida validada
  end
```

Si no hay proveedor permitido disponible, el sistema pasa a degradación L2: el editor, los validadores, el versionado y el export siguen funcionando (FR-AIO-04).

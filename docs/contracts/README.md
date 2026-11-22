# Contratos

**Versión:** 0.1-draft · **Estado:** Proposed (no implementados) · **Fuente:** [05](../05-Technical-Specifications.md), [ADR-021](../adr/ADR-021-estilo-api.md)

| Contrato | Formato | Contenido | Requisitos |
|---|---|---|---|
| [openapi.yaml](openapi.yaml) | OpenAPI 3.1 | API REST `/v1`: grupos, planes, secciones, patches, aprobación, validación, borradores, export, eventos, memoria, manifiestos, currículo, tareas y gates | FR-API-01..05, FR-PLN-*, FR-MEM-* |
| [asyncapi.yaml](asyncapi.yaml) | AsyncAPI 3.0 | Eventos de dominio del outbox y webhooks firmados | FR-API-06 |
| [schemas/problem-details.schema.json](schemas/problem-details.schema.json) | JSON Schema 2020-12 | Errores RFC 9457 | FR-API-01 |
| [schemas/plan-section.schema.json](schemas/plan-section.schema.json) | JSON Schema 2020-12 | Sección, contenido por tipo (actividad, anexo, indicador) | FR-PLN-01, FR-PLN-07, FR-PLN-08 |
| [schemas/patch.schema.json](schemas/patch.schema.json) | JSON Schema 2020-12 | Patch con diff e impacto | FR-PLN-03, FR-PLN-06 |
| [schemas/decision-event.schema.json](schemas/decision-event.schema.json) | JSON Schema 2020-12 | Evento de decisión append-only | FR-MEM-01 |
| [schemas/memory-fact.schema.json](schemas/memory-fact.schema.json) | JSON Schema 2020-12 | Hecho de memoria con evidencia y validez | FR-MEM-02, FR-MEM-03 |
| [schemas/context-manifest.schema.json](schemas/context-manifest.schema.json) | JSON Schema 2020-12 | Manifiesto de contexto | FR-AIO-02, FR-MEM-05 |
| [schemas/curriculum-rule.schema.json](schemas/curriculum-rule.schema.json) | JSON Schema 2020-12 | Regla curricular versionada | FR-CUR-02 |
| [mcp-tools/](mcp-tools/) | JSON (esquemas MCP + metadatos de política) | `curriculum.search_outcomes`, `plan.read_sections`, `plan.propose_patch`, `memory.search_facts`, `memory.propose_fact` | FR-AGX-02, FR-AGX-05 |
| [interfaces.md](interfaces.md) | TypeScript ilustrativo | Puertos `LLMProvider`, `MemoryRetrieval`, `ToolRegistry`, `AgentRuntime`, `TaskStore`, `DocumentRenderer`, `AuthorizationPort`, `DecisionLog`, `KeyService` | EIR-01, EIR-03 |

**Reglas comunes:** sin PII de menores en ningún ejemplo ni payload; `additionalProperties: false` en entradas; dominios `example.invalid` como marcadores de lugar hasta definir el dominio real (OD-01). La verificación de contratos en CI (linters de OpenAPI y AsyncAPI, validación de JSON Schema y pruebas de contrato) forma parte de la estrategia de pruebas ([10 §2](../10-Test-Strategy.md)) cuando exista implementación.

# Contratos

**Versión OpenAPI:** 1.0.0 propuesta · **Estado:** Proposed; no congelado y aún sin implementación de backend · **Fuente:** [05](../05-Technical-Specifications.md), [ADR-021](../adr/ADR-021-estilo-api.md)

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

El paquete de contratos en [`packages/contracts`](../../packages/contracts/package.json) proporciona lint de OpenAPI, tipos TypeScript generados, validación de esquemas JSON Schema 2020-12 con Ajv, un comparador de compatibilidad y un mock local con datos sintéticos. `pnpm --filter @catarina/contracts check:compatibility` compara contra `BASE_REF` (por defecto `origin/main`) y falla ante cambios incompatibles según las reglas de Redocly. La política de deprecación y el historial están en [CHANGELOG.md](CHANGELOG.md). El gate humano H-TL conserva la decisión de congelar contratos (13 §5.1).

**El mock NO acredita backend real.** El mock responde solo `/v1/plans` con datos sintéticos y demuestra la forma del error y la semántica de paginación de su propia fixture. No ejecuta PostgreSQL, RLS, PDP, transacciones, idempotencia ni currículo real. En consecuencia:

| TC | Evidencia disponible (contrato/linter/mock) | Estado frente a la API real |
|---|---|---|
| TC-FR-API-01 | `redocly lint` (0 errores), Ajv 2020-12 sobre todos los esquemas y ejemplos publicados en `Problem`, prueba de que `type` sigue el sufijo `code` estable | **PARCIAL**: falta validar respuestas 4xx/5xx emitidas por el backend real |
| TC-FR-API-04 | Declaración de `limit` 1..100, cursor con orden `(created_at, id)` y snapshots ante inserciones, filtros/orden declarados por recurso; mock demuestra máximo y estabilidad ante inserciones **solo en su fixture** | **PARCIAL/pendiente**: filtros, orden, opacidad del cursor y estabilidad ante inserciones requieren BD real; no marcar aprobado con el mock |
| TC-FR-API-05 | Comparador `redocly diff --extends=diff-recommended --fail-on=major` con fixture incompatible (falla por `major`) y compatible (pasa); `Deprecation`/`Sunset` reservadas y documentadas en `CHANGELOG.md` | **PARCIAL**: CI y política listos; deprecación real y rechazo en pipeline de integración dependen de AG-PLT/WP-10 |

**Bloqueo AsyncAPI (B2).** La validación de `asyncapi.yaml` con el CLI de AsyncAPI sigue **bloqueada** por el rechazo de telemetría externa vigente en revisión automática. No se ejecuta `pnpm lint`, `pnpm check`, `asyncapi validate`, CLI, wrapper/config ni ruta indirecta que pueda evadir ese rechazo. Una validación individual previa reportó 0 errores, pero es solo una comprobación parcial y no sustituye la validación autorizada en CI. Dato para el humano, sin corrección: `@asyncapi/cli@6.2.2` declara `engines.node >=24.0.0` mientras CI fija Node 22; no se cambia la versión de Node ni del CLI para no eludir el rechazo.

**Verificación WP-02 ejecutable (sin AsyncAPI):** `redocly lint --extends=minimal docs/contracts/openapi.yaml` (directo, sin el script `lint` que encadena AsyncAPI); `node --test packages/contracts/test/contract.test.mjs` (Ajv 2020-12); `node --test packages/contracts/test/compatibility-diff.test.mjs` (fixtures compatible/breaking); `node --test packages/contracts/test/mock-pagination.test.mjs` (mock); `node --test packages/contracts/test/types-drift.test.mjs` (drift de tipos); generación de tipos con `openapi-typescript` directo. Ver [verificación](verification/2026-11-22-wp02.md).

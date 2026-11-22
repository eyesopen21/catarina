# Changelog de contratos

**Estado general:** Proposed — no congelado. El gate humano H-TL (13 §5.1) decide la congelación de v1.

Convención: los cambios se clasifican según [05 §9](../05-Technical-Specifications.md). Cambios compatibles (campos opcionales, recursos nuevos, valores de enum documentados como extensibles) no requieren nueva versión. Cambios incompatibles (eliminar/renombrar campos, cambiar semántica, endurecer validaciones) requieren `/v2` y aprobación de H-TL (13 §6.2). Los clientes MUST ignorar campos y valores de enum desconocidos.

## Política de deprecación

- Una operación o campo deprecado se anuncia con las cabeceras `Deprecation` (fecha/valor de deprecación) y `Sunset` (fecha HTTP de retirada), declaradas en `openapi.yaml` (`components.headers`).
- Preaviso mínimo: **≥ 6 meses (provisional, pendiente de decisión)** entre el aviso y la retirada; se registra aquí la fecha de aviso, el sustituto y la fecha `Sunset`.
- Ninguna operación de `v1` está deprecada en esta revisión; las cabeceras existen como mecanismo, no como declaración de deprecación activa.

## 1.0.0 — Proposed (2026-11-22, WP-02)

- Contrato REST `/v1` derivado de 02-SRS y 05-Technical-Specifications; errores `application/problem+json` con `type` estable por `code` (`problem-details.schema.json`).
- Paginación por cursor con `limit` 1..100 (default 25), orden estable `(created_at, id)` y filtros/orden declarados por recurso.
- Esquemas JSON Schema 2020-12 y tipos TypeScript generados a partir de `openapi.yaml`.
- Comparador de contratos en CI: `redocly diff --extends=diff-recommended --fail-on=major` contra `BASE_REF` (por defecto `origin/main`).
- Mock local con datos sintéticos: demuestra únicamente semántica de paginación y forma de error; **no** acredita comportamiento de backend.
- `asyncapi.yaml` queda como borrador Proposed; su validación con CLI está pendiente de autorización por el rechazo de telemetría vigente.

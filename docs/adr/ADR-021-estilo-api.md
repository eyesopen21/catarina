# ADR-021: Estilo de API — REST/OpenAPI 3.1, RFC 9457, ETag/If-Match, Idempotency-Key; AsyncAPI para eventos

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [05 §4–11](../05-Technical-Specifications.md), [contracts/](../contracts/README.md) · FR-API-01..07, EIR-04

## Context
Varios clientes (web, servidor MCP, integraciones institucionales) y operaciones con concurrencia y reintentos: aceptar un patch, aprobar o exportar no deben duplicarse ni perder actualizaciones.

## Decision Drivers
- Contratos verificables y generación de tipos (FR-API-01).
- Concurrencia optimista a nivel HTTP (FR-API-02).
- Reintentos seguros (FR-API-03).
- Autorización por recurso fácil de razonar (OWASP API1/API5).

## Considered Options
1. **REST + OpenAPI 3.1 + JSON Schema 2020-12; eventos en AsyncAPI.**
   - Pros: estándares maduros; ETag/If-Match y RFC 9457 encajan directamente; autorización por recurso clara.
   - Contras: vistas compuestas pueden requerir varias llamadas.
2. **GraphQL.**
   - Pros: consultas flexibles.
   - Contras: autorización por campo compleja; consultas costosas difíciles de limitar; no encaja con ETag por recurso.
3. **gRPC.**
   - Pros: eficiencia y tipado.
   - Contras: menos conveniente para navegador y terceros.

## Decision
**Propuesta:** opción 1, con versión en la ruta (`/v1`), errores `application/problem+json`, paginación por cursor y webhooks firmados con HMAC.

## Consequences
- Positivas: contratos testeables; clientes simples.
- Negativas: posibles endpoints de composición para vistas complejas.

## Risks
- Deriva entre contrato e implementación → pruebas de contrato y comparador de OpenAPI en CI.

## Revisit Triggers
Si el frontend requiere agregación extensa (patrón BFF).

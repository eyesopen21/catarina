# ADR-019: Redis y colas dedicadas — no incluidos en el MVP

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** ADR-005, ADR-008 · FR-API-07, NFR-SCL-01, NFR-PERF-01

## Context
Una caché o una cola en memoria pueden mejorar latencia y throughput, pero añaden estado, modos de falla y otra superficie que proteger. Las necesidades del MVP (cola de trabajos, idempotencia, rate limiting básico) pueden cubrirse con PostgreSQL (ADR-008) y caché en proceso.

## Decision Drivers
- Necesidad medida antes de añadir componentes (S28 R7).
- Consistencia: el encolado debe ser atómico con el cambio de dominio (ADR-005).
- Superficie de seguridad mínima.

## Considered Options
1. **Sin Redis**: caché en proceso, cola y claves de idempotencia en PostgreSQL, rate limiting con contadores en BD o en el balanceador.
   - Pros: un componente menos; encolado transaccional.
   - Contras: el rate limiting compartido entre réplicas es menos eficiente.
2. **Redis para caché, rate limiting y colas.**
   - Pros: baja latencia; primitivas útiles.
   - Contras: otro componente que operar, respaldar y proteger; las colas no son transaccionales con la BD.

## Decision
**Propuesta:** opción 1 en el MVP.

## Consequences
- Positivas: menor superficie operativa.
- Negativas: posibles cuellos de botella en la BD bajo carga alta.

## Risks
- Subestimar la carga → pruebas de carga con el perfil de NFR-SCL-01.

## Revisit Triggers
Las pruebas de carga o las métricas del piloto muestran un cuello de botella en la BD atribuible a caché, rate limiting o colas.

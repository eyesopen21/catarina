# ADR-005: Concurrencia — OCC con versiones, CAS, outbox transaccional y consumidores idempotentes

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [08](../08-Concurrency-Consistency.md) · FR-PLN-03, FR-API-02, FR-API-03, FR-API-06, FR-AGX-07, INV-01, INV-11

## Context
Hay carreras con impacto en el dominio: actualizaciones perdidas en el editor, aprobación concurrente con un patch, tareas duplicadas, salidas de agente basadas en versiones viejas y publicación de eventos que puede fallar tras el commit (08 §2).

## Decision Drivers
- Proteger INV-01 e INV-11 sin bloqueos largos.
- Entrega fiable de eventos sin transacciones distribuidas.
- Carreras reproducibles en pruebas (08 §7).
- No añadir componentes de coordinación en el MVP (ADR-001, ADR-019).

## Considered Options
1. **OCC** (`row_version` + ETag/If-Match), **UPDATE condicional (compare-and-swap)**, bloqueo de fila de la raíz de agregado para transiciones multi-fila, **outbox transaccional** y consumidores idempotentes.
   - Pros: correctitud dentro de una transacción de BD; sin coordinadores externos; conflictos informados al cliente (409/412).
   - Contras: el cliente maneja conflictos; las claves de idempotencia requieren diseño cuidadoso.
2. **Locks distribuidos** para toda mutación.
   - Pros: exclusión mutua fácil de razonar.
   - Contras: un lease puede expirar con el proceso vivo (requiere fencing de todos modos); componente adicional; innecesario con todo el estado en una BD transaccional.
3. **Event sourcing completo.**
   - Pros: auditoría y reconstrucción totales.
   - Contras: complejidad de proyecciones y versionado de eventos; el encargo pide no adoptarlo sin necesidad; `decision_event` ya cubre la trazabilidad pedagógica.

## Decision
**Propuesta:** opción 1. `READ COMMITTED` por defecto con CAS; `SELECT … FOR UPDATE` sobre `lesson_plan` cuando una transición dependa de varias secciones; `SERIALIZABLE` con reintento solo donde el análisis de write skew lo exija; sin locks distribuidos en el MVP.

## Consequences
- Positivas: invariantes en la BD; entrega at-least-once con deduplicación por `event_id`.
- Negativas: propagación eventual de eventos (aceptable: las proyecciones no son fuente de verdad).

## Risks
- Claves de idempotencia mal diseñadas → pruebas R-05 y R-09 de 08.

## Revisit Triggers
Reevaluar locks distribuidos solo si aparece un recurso compartido fuera de PostgreSQL que requiera exclusión mutua.

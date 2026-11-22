# ADR-008: Ejecución durable — cola en PostgreSQL en el MVP; Temporal diferido con criterios de entrada

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [07 §4–5](../07-AI-Agentic-Architecture.md), [08](../08-Concurrency-Consistency.md) · FR-AGX-01, FR-AGX-07, FR-AGX-08, FR-PLN-11, NFR-SCL-01

## Context
Las tareas largas con esperas humanas, temporizadores y compensaciones pertenecen a la Etapa 3 (S26). El MVP necesita trabajos asíncronos cortos: export, validación, generación de borradores, proyección del grafo y relay del outbox. S21 propone Temporal como alternativa a verificar en piloto, no como dogma.

## Decision Drivers
- Durabilidad y reanudación sin perder estado (FR-AGX-01).
- Idempotencia y fencing (FR-AGX-07).
- Complejidad operativa del MVP (ADR-001).
- Workflows con esperas humanas largas solo a partir de la Etapa 3.

## Considered Options
1. **Cola de trabajos en PostgreSQL** (`SELECT … FOR UPDATE SKIP LOCKED`, lease con expiración y fencing token) + outbox.
   - Pros: sin componente nuevo; el encolado es transaccional con el cambio de dominio.
   - Contras: sin historial de ejecución, timers durables ni versionado de workflows integrados.
2. **Redis + librería de colas.**
   - Pros: integración rápida y baja latencia.
   - Contras: el encolado no es atómico con el cambio en la BD sin un outbox adicional; otro componente que operar y proteger (ADR-019).
3. **Temporal (durable execution).**
   - Pros: workflows con esperas humanas, timers, reintentos y versionado nativos; historial de ejecución.
   - Contras: clúster adicional (o servicio gestionado); modelo de programación determinista con curva de aprendizaje; mayor costo operativo.

## Decision
**Propuesta:** opción 1 en el MVP, detrás de las interfaces `TaskStore` y `AgentRuntime` (05 §12) para que la migración no toque el dominio. Al iniciar la Etapa 3, ejecutar un spike con Temporal (u otra opción equivalente) si se cumplen los criterios de entrada de 07 §5.

## Consequences
- Positivas: un solo motor en el MVP; el encolado y el cambio de dominio son atómicos.
- Negativas: visibilidad limitada de ejecuciones; riesgo de reimplementar partes de un motor de workflows.

## Risks
- Crecimiento del motor casero → alcance acotado y criterios de migración explícitos.

## Revisit Triggers
Ver criterios de 07 §5: varios workflows validados que requieren esperas humanas de días, temporizadores o compensaciones multi-paso.

# ADR-018: Memoria pedagógica — log de eventos + hechos con estado, procedencia y validez temporal

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [03 §8](../03-Domain-Model-Pedagogy.md), [06 §3.4](../06-Data-Architecture.md), [07 §8](../07-AI-Agentic-Architecture.md) · FR-MEM-01..10, FR-PLN-12, INV-03, INV-04, INV-07, DAT-02, DAT-04

## Context
La memoria pedagógica es el activo principal (S06). Debe conservar evidencia, procedencia, temporalidad y estado de aprobación, y no puede depender del contexto del modelo (S20). S02 prohíbe resumir borrando correcciones, aprobaciones o justificaciones; los resúmenes son índices, no fuente de verdad (S03).

## Decision Drivers
- No convertir inferencias en hechos (INV-04).
- Derecho de rectificación y borrado con invalidación de derivados (FR-MEM-04).
- Explicabilidad de cada recuerdo (FR-MEM-05).
- Continuidad tras cambiar de proveedor de IA (G05).

## Considered Options
1. **`DecisionEvent` append-only + `MemoryFact`/`MemoryEvidence`** con condición, estado y validez; embeddings y resúmenes como derivados invalidables.
   - Pros: fuente de verdad clara; reversible; la memoria sobrevive a cambios de proveedor.
   - Contras: más estructuras y una UX de confirmación que diseñar.
2. **Solo resúmenes del chat.**
   - Pros: simple.
   - Contras: pierde correcciones y aprobaciones; S02 lo prohíbe.
3. **Event sourcing de todo el sistema.**
   - Pros: auditoría completa.
   - Contras: complejidad no justificada; ver ADR-005.

## Decision
**Propuesta:** opción 1. La consolidación solo crea hechos `candidate`; confirmar requiere acción docente y ≥1 evidencia (INV-03). Una decisión de un plan no se generaliza sin confirmación separada (FR-MEM-09).

## Consequences
- Positivas: memoria auditable y corregible.
- Negativas: riesgo de fatiga del docente al confirmar.

## Risks
- Fatiga de confirmación → agrupar candidatos, límites de volumen y descartes rápidos; medir tasa de aceptación.

## Revisit Triggers
Revisar la carga de confirmación y la tasa de aceptación en el piloto.

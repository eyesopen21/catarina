# ADR-003: Knowledge Graph — grafo sobre PostgreSQL (proyección) frente a Neo4j

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [06 §7](../06-Data-Architecture.md) · FR-MEM-04, FR-MEM-06, INV-08, DAT-02, DAT-04, FR-STU-02

## Context
S06 exige un **grafo curricular público** y un **grafo pedagógico privado** que no se fusionan, con procedencia, validez temporal y acceso por propósito. Las consultas previstas son recorridos cortos (aprendizaje → actividad → anexo → indicador; grupo → hechos confirmados). La fuente de verdad son eventos y hechos relacionales (ADR-018); el grafo es un índice de recuperación.

## Decision Drivers
- Autorización consistente con el resto de los datos (INV-05, INV-08).
- Sin acceso libre de agentes al grafo (FR-STU-02, FR-AGX-05).
- Reconstrucción e invalidación de derivados (DAT-04, FR-MEM-04).
- Complejidad operativa del MVP.

## Considered Options
1. **Tablas `graph_node`/`graph_edge` en PostgreSQL**, particionadas por scope, con RLS y recorridos acotados (CTE recursivas con profundidad máxima).
   - Pros: misma frontera transaccional y de autorización; reconstruible desde eventos; restricciones de BD impiden aristas público → privado.
   - Contras: recorridos profundos menos expresivos.
2. **Neo4j u otro motor de grafos.**
   - Pros: lenguaje y rendimiento pensados para recorridos.
   - Contras: segunda frontera de autorización que replicar; sincronización con la fuente de verdad; un lenguaje de consulta general expuesto a agentes amplía el riesgo de acceso no restringido.
3. **Sin grafo** (solo relaciones y búsqueda).
   - Pros: mínimo esfuerzo.
   - Contras: no cubre la recuperación por relaciones y procedencia que pide S06.

## Decision
**Propuesta:** opción 1. Todo acceso pasa por `GraphAccessService` con peticiones tipadas (sin SQL ni Cypher libre), profundidad ≤ 3 y filtros de vigencia, audiencia y propósito (06 §7.3).

## Consequences
- Positivas: el aislamiento entre grupos y tenants se prueba con las mismas suites que el resto (NFR-SEC-03).
- Negativas: la proyección debe mantenerse idempotente; expresividad limitada.

## Risks
- Crecimiento del grafo curricular que degrade recorridos → particionado e índices; medir en piloto.

## Revisit Triggers
Reevaluar un motor de grafos si docentes validan consultas que requieran más de tres saltos y no cumplen NFR-PERF-01 con índices optimizados.

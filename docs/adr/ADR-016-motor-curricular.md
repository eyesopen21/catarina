# ADR-016: Motor curricular — reglas versionadas dirigidas por datos con validadores deterministas

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto, con especialistas curriculares
- **Relacionado:** [03 §7](../03-Domain-Model-Pedagogy.md), [contracts/schemas/curriculum-rule.schema.json](../contracts/schemas/curriculum-rule.schema.json) · FR-CUR-01..06, FR-PLN-08, BR-02, BR-03, INV-10, INV-12

## Context
S05 define los campos de una regla (`source_id`, `source_version`, `effective_from`, …) y exige separar mandato MEP, recomendación pedagógica, preferencia docente y política institucional. S05 y S24 exigen revisión humana experta por área: el agente no certifica su propia exactitud normativa. S22: la búsqueda de norma MEP usa recuperación con citas y validador determinista, no redacción libre.

## Decision Drivers
- Trazabilidad a fuente y versión (FR-CUR-01).
- Validaciones reproducibles por versión (INV-12).
- Honestidad normativa (BR-02, FR-CUR-03).
- Mantenimiento con especialistas curriculares que no programan.

## Considered Options
1. **Reglas como datos** (`CurriculumRule`) con esquema, publicadas inmutables por versión, ejecutadas por validadores deterministas registrados (`validator_id`); el LLM solo explica hallazgos.
   - Pros: auditables, versionables, revisables por expertos.
   - Contras: inversión inicial en modelado; no toda regla es expresable como datos.
2. **Reglas dentro de los prompts.**
   - Pros: rápido.
   - Contras: ni verificables ni reproducibles; el modelo puede inventar obligaciones (G07).
3. **Una función de código por regla.**
   - Pros: flexible.
   - Contras: los especialistas no pueden revisarla directamente.

## Decision
**Propuesta:** opción 1, con validadores en código para los casos complejos (p. ej. orden de momentos de resolución de problemas), siempre referenciados desde la regla. Si una regla no tiene validación experta registrada, el resultado es `validation_incomplete`.

## Consequences
- Positivas: cumplimiento explicable con cita; la revalidación anual es manejable.
- Negativas: esfuerzo de extracción y modelado por asignatura.

## Risks
- Error normativo por extracción defectuosa (S28 R4) → revisión experta obligatoria y fecha de revalidación por ciclo lectivo.

## Revisit Triggers
Tras la primera revalidación anual o al ampliar a secundaria.

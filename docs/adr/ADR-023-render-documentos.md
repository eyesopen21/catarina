# ADR-023: Exportación — renderizador determinista en servidor (DOCX/PDF) a partir de versiones identificadas

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [05 §14](../05-Technical-Specifications.md) · FR-PLN-07, FR-PLN-11, EIR-03, INV-09, BR-05, BR-10

## Context
El export debe reproducir exactamente las versiones elegidas, sin referencias duplicadas ni anexos incompletos, y separar el material del estudiante del solucionario docente (S07, S10). Exportar no es entregar oficialmente (BR-10).

## Decision Drivers
- Reproducibilidad: misma entrada, mismo documento (EIR-03).
- INV-01: el export nunca altera contenido aprobado.
- Fidelidad a plantillas por asignatura y modalidad.

## Considered Options
1. **Renderizador determinista** con plantillas parametrizadas, ejecutado en el worker y con hash del resultado.
   - Pros: testeable y reproducible; no modifica contenido.
   - Contras: mantener plantillas por asignatura y modalidad.
2. **Pedir al LLM el documento final.**
   - Pros: rápido de prototipar.
   - Contras: no determinista; puede alterar texto aprobado (incumple INV-01).
3. **Exportar solo HTML/Markdown.**
   - Pros: simple.
   - Contras: no cubre los formatos que usan los docentes (S07: DOCX/PDF/impresión).

## Decision
**Propuesta:** opción 1. El LLM no participa en el render final. Las librerías concretas se evalúan por licencia y fidelidad (OD-10).

## Consequences
- Positivas: export reproducible y verificable por hash.
- Negativas: esfuerzo de plantillas.

## Risks
- Divergencia con la plantilla oficial vigente → revisión por especialistas al cargar cada plantilla.

## Revisit Triggers
Tras el primer ciclo con docentes del piloto.

# ADR-004: Modelo documental — secciones tipadas, versiones inmutables y aprobación con CAS

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [03 §3–5](../03-Domain-Model-Pedagogy.md), [06 §3.3](../06-Data-Architecture.md) · FR-PLN-01, FR-PLN-03, FR-PLN-04, FR-PLN-05, FR-PLN-06, FR-PLN-09, FR-PLN-15, INV-01, INV-02

## Context
La aprobación docente es invariante funcional. El plan es un documento vivo editado por bloques, con diffs, anexos e impacto; la prueba de aceptación de S07 exige que los bloques aprobados queden **byte a byte idénticos** al modificar otro.

## Decision Drivers
- Inmutabilidad verificable de lo aprobado (INV-01).
- Reversión no destructiva (FR-PLN-09) y ledger de autoría (FR-PLN-15).
- Aprobación ligada a lo que el docente vio (FR-PLN-05).
- Impacto calculable por enlaces entre secciones (FR-PLN-06).

## Considered Options
1. **`PlanSection` + `ArtifactVersion` inmutable con `content_hash`**, puntero `current_version_id`, `Approval` sobre una versión concreta y cambios solo vía `Patch` con `base_version_id`.
   - Pros: inmutabilidad por construcción; diffs y reversión simples; autoría por versión.
   - Contras: más entidades y transiciones; crecimiento del almacenamiento de versiones.
2. **Documento JSON único editado en sitio con histórico.**
   - Pros: simple.
   - Contras: no hay frontera natural para congelar partes; se pierde la autoría por fragmento.
3. **Edición colaborativa en tiempo real (CRDT/OT).**
   - Pros: coedición fluida.
   - Contras: resuelve conflictos de texto, no la semántica de aprobación; el MVP es de un docente por plan (S09).

## Decision
**Propuesta:** opción 1. Estados de sección `draft | proposed | approved | reopened`; la versión reemplazada queda `superseded` (OD-12). Un patch sobre `approved` se rechaza con `409 section-approved`. El hash detecta alteraciones pero **no** sustituye la autorización (S07).

## Consequences
- Positivas: INV-01 se hace cumplir en dominio, BD (trigger) y pruebas de propiedad.
- Negativas: la coedición simultánea no es fluida en el MVP.

## Risks
- Transiciones mal definidas → pruebas de propiedad y de concurrencia (08 R-01, R-04).

## Revisit Triggers
Evaluar CRDT/OT solo si el piloto muestra coedición simultánea como necesidad real (coordinación institucional).

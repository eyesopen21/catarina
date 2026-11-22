# ADR-011: Ejecución aislada — sandbox bajo demanda solo en la Etapa 4

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [07 §13](../07-AI-Agentic-Architecture.md) · FR-AGX-06, SPR-05

## Context
S21: no mantener una VM 24/7 por docente; crear entornos aislados bajo demanda para código, edición masiva de documentos o navegación, con TTL, cuotas, red en allowlist y volúmenes temporales. S26 ubica la ejecución aislada en la Etapa 4. Ninguna funcionalidad del MVP ejecuta código no confiable: export y validación son deterministas y se ejecutan en el worker.

## Decision Drivers
- Aislamiento fuerte cuando se ejecute código no confiable (FR-AGX-06).
- No introducir complejidad sin caso de uso (S28 R7, R9).
- Restricción de egress (SPR-05).

## Considered Options
1. **Sin sandbox en el MVP**; operaciones deterministas en el worker.
   - Pros: sin componente adicional.
   - Contras: los artefactos que requieran ejecutar código (interactivos complejos) no están disponibles.
2. **Contenedor endurecido** (gVisor, seccomp, sistema de archivos de solo lectura).
   - Pros: arranque rápido y operación conocida.
   - Contras: frontera de aislamiento más débil que una microVM, porque comparte más superficie con el host.
3. **MicroVM** (Firecracker o Kata Containers) con TTL, cuotas y egress en allowlist.
   - Pros: aislamiento a nivel de hipervisor.
   - Contras: requiere virtualización en el host; operación más compleja.

## Decision
**Propuesta:** opción 1 en el MVP. Para la Etapa 4, spike comparando 2 y 3 sobre los casos de uso validados, con los requisitos de FR-AGX-06 y SPR-05 como criterios de aceptación. Ningún secreto de proveedor ni dato de estudiante entra al sandbox en ningún caso.

## Consequences
- Positivas: evita complejidad prematura.
- Negativas: algunos artefactos interactivos esperan a la Etapa 4.

## Risks
- Presión por adelantar la función → gate de valor pedagógico (11 §9).

## Revisit Triggers
Al menos dos casos de uso validados con docentes que requieran ejecutar código o navegar.

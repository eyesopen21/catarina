# ADR-010: MCP y A2A — Tool Registry propio con políticas; MCP como interfaz controlada; A2A diferido

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [07 §10](../07-AI-Agentic-Architecture.md), [05 §13](../05-Technical-Specifications.md), [contracts/mcp-tools/](../contracts/mcp-tools/) · FR-AGX-02, FR-AGX-04, FR-AGX-05, FR-STU-02, SPR-04

## Context
S22 y S23 exigen que MCP no exponga el grafo ni la bóveda sin herramientas restringidas y que el contenido no confiable no eleve permisos. Las descripciones y salidas de herramientas pueden contener instrucciones maliciosas (*tool poisoning*). S21 deja A2A como opcional entre sistemas con identidades y permisos fuertes.

## Decision Drivers
- Mínimo privilegio y prevención de *excessive agency* (FR-AGX-02).
- Ningún acceso crudo a datos (FR-STU-02, INV-08).
- Herramientas que actúan con la autorización del docente solicitante.
- Interoperabilidad futura sin ampliar la superficie hoy.

## Considered Options
1. **Tool Registry interno + servidor MCP** que expone solo herramientas con contrato (esquemas, scopes, validación, efectos laterales) y allowlist por agente.
   - Pros: superficie conocida y auditable; contratos verificables en CI.
   - Contras: trabajo de diseño por herramienta.
2. **Herramientas genéricas** (SQL, consulta de grafo) vía MCP.
   - Pros: rápido.
   - Contras: incumple INV-06 e INV-08.
3. **A2A inmediato.**
   - Pros: interoperabilidad entre agentes.
   - Contras: sin caso de uso demostrado; superficie adicional.

## Decision
**Propuesta:** opción 1. Las herramientas de escritura solo **proponen** (`plan:propose`, `memory:propose`); ninguna aprueba ni confirma. Servidores MCP externos (como cliente) solo en allowlist y su salida se trata como contenido no confiable. A2A fuera de alcance hasta que exista un socio con caso de uso.

## Consequences
- Positivas: superficie reducida y auditable.
- Negativas: más esfuerzo de contratos.

## Risks
- Deriva entre contrato e implementación → pruebas de contrato en CI.

## Revisit Triggers
Reabrir cuando un socio institucional requiera A2A o se necesiten herramientas nuevas con efectos laterales.

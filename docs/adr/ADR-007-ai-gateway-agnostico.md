# ADR-007: AI Gateway — puerto propio agnóstico con adaptadores (LiteLLM como adaptador candidato)

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [07 §9](../07-AI-Agentic-Architecture.md), [05 §12](../05-Technical-Specifications.md) · FR-AIO-01, FR-AIO-03, FR-AIO-04, FR-AIO-05, FR-AIO-06, EIR-01, NFR-COST-01

## Context
S22 exige no codificar ningún modelo como requisito esencial, mantener un registro de capacidades y condiciones de privacidad por modelo, BYOK sin que equivalga a consentimiento, y routing evaluado por tarea. Los nombres y capacidades de modelos cambian con frecuencia. Todo envío a un proveedor externo con información de grupos requiere DLP y control de egress (FR-AIO-03).

## Decision Drivers
- Independencia del proveedor (FR-AIO-01, S28 R10).
- Un único punto de control para DLP, egress, presupuestos y registro (FR-AIO-03, FR-AIO-06).
- Degradación cuando falla un proveedor (FR-AIO-04).
- La lógica de seguridad no debe depender de una librería externa que cambie su comportamiento sin control.

## Considered Options
1. **Puerto `LLMProvider` propio + gateway interno delgado + adaptadores por proveedor** (un adaptador MAY envolver LiteLLM o el SDK oficial).
   - Pros: las políticas de datos viven en código propio y testeado; los adaptadores son sustituibles; el contrato es estable aunque cambien los proveedores.
   - Contras: mantenimiento de adaptadores; posible rezago frente a funciones nuevas.
2. **LiteLLM Proxy como gateway completo.**
   - Pros: cobertura amplia de proveedores; puesta en marcha rápida.
   - Contras: un componente externo queda en la ruta crítica de DLP, egress y claves; su licencia, versión y postura de seguridad deben evaluarse; las políticas propias tendrían que expresarse en su modelo de configuración.
3. **SDK directo de un proveedor.**
   - Pros: mínimo esfuerzo inicial.
   - Contras: incumple FR-AIO-01 y G05.

## Decision
**Propuesta:** opción 1. DLP, egress, presupuestos, routing y registro de metadatos están en `CMP-AIO-*`; los adaptadores solo traducen llamadas. El MVP conecta un proveedor (S26 Etapa 1) y un adaptador simulado para la suite de contrato (EIR-01).

## Consequences
- Positivas: cambiar de proveedor no toca memoria ni aprobaciones; políticas de datos uniformes.
- Negativas: esfuerzo propio para streaming y tool-calling de cada proveedor.

## Risks
- Divergencia entre proveedores en tool-calling, streaming o formatos estructurados → suite de contrato por adaptador.

## Revisit Triggers
Revisar si un gateway externo autoalojado, tras evaluación de licencia y seguridad, puede alojar las mismas políticas con menos esfuerzo que los adaptadores propios.

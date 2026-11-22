# ADR-009: Orquestación agéntica — supervisor–worker con workflow determinista propio

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [07 §2–5, §11](../07-AI-Agentic-Architecture.md) · FR-PLN-02, FR-AGX-01, FR-AGX-03, FR-IAM-06

## Context
S19 indica que las operaciones comunes no necesitan un equipo de modelos ni microVM: bastan herramientas especializadas y validadores deterministas; los agentes complejos se reservan para tareas largas con riesgos controlados. S21 fija límites de autonomía y S28 R7 advierte sobre complejidad agéntica prematura. Hay que separar qué decide el código y qué se delega al LLM.

## Decision Drivers
- Comportamiento verificable y testeable (FR-PLN-02).
- Gates humanos por construcción (FR-AGX-03).
- Separación explícita determinista / LLM / humano (07 §3).
- Evitar dependencia de un framework de evolución rápida.

## Considered Options
1. **Máquina de estados propia** de tareas y pasos, con pasos LLM como funciones tipadas (entrada y salida con esquema) y adaptador opcional a un framework.
   - Pros: cada paso tiene contrato; los gates humanos son estados explícitos; superficie de dependencias pequeña.
   - Contras: se implementan planificación y checkpoints básicos.
2. **LangGraph (u otro framework) como núcleo.**
   - Pros: primitivas de grafos de agentes y checkpointing listas.
   - Contras: el modelo de ejecución del framework define el del producto; evolución rápida de su API; requiere revisión de seguridad de la dependencia.
3. **Multiagente libre** (agentes que conversan entre sí).
   - Pros: flexibilidad.
   - Contras: difícil de auditar y de acotar en costo; contradice S19 y S26.

## Decision
**Propuesta:** opción 1. Cada paso se clasifica como `D` (determinista), `L` (LLM) o `H` (humano). Un framework MAY implementar un paso `L` tras un spike, nunca el control de estados ni los gates. No se despliega multiagente sin valor medido en piloto (S26 Etapa 3).

## Consequences
- Positivas: auditable; gates no omitibles.
- Negativas: menos funciones listas para usar.

## Risks
- Presión por adoptar frameworks sin evaluación → exigir spike con criterios de 10 §6.

## Revisit Triggers
Revisar con la evidencia del piloto de la Etapa 3.

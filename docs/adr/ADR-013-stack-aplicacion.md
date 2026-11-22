# ADR-013: Stack de aplicación — TypeScript de extremo a extremo frente a TypeScript + Python (FastAPI)

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto, según composición del equipo (OD-10)
- **Relacionado:** [05 §3](../05-Technical-Specifications.md) · FR-API-01, NFR-USA-01, NFR-I18N-01

## Context
S19 sugiere de forma no prescriptiva frontend TypeScript/React y backend TypeScript o Python, sin atarse a un framework. El frontend necesita un editor por bloques con diff, aprobación y paneles (S09). El trabajo de IA es orquestación e I/O hacia proveedores, no entrenamiento de modelos (S01 no objetivos). Los contratos OpenAPI y JSON Schema son el límite entre componentes (ADR-021).

## Decision Drivers
- Contratos tipados compartidos entre frontend y backend (FR-API-01).
- Capacidad y experiencia del equipo (desconocida: OD-10).
- Ecosistema de SDK de proveedores de IA y MCP.
- Mantenibilidad con un equipo pequeño.

## Considered Options
1. **TypeScript de extremo a extremo** (React, SSR opcional con Next.js; backend NestJS u equivalente).
   - Pros: un lenguaje y un toolchain; tipos generados desde los contratos para cliente y servidor.
   - Contras: el ecosistema de procesamiento de lenguaje y datos es menor que el de Python (no se requiere entrenamiento).
2. **TypeScript en frontend + Python (FastAPI) en backend.**
   - Pros: ecosistema de IA y datos amplio; validación con modelos tipados.
   - Contras: dos lenguajes y dos toolchains; generación de tipos en ambos lados.
3. **Backend en Java/Kotlin o .NET.**
   - Pros: plataformas maduras para sistemas empresariales.
   - Contras: menor afinidad con la mayor parte del ecosistema de SDK de IA y MCP.

## Decision
**Propuesta:** opción 1, **condicionada** a la composición del equipo. Si el equipo es principalmente Python, la opción 2 es equivalente para este diseño: ni el dominio ni los contratos cambian. SPA o SSR se decide tras el prototipo del editor.

## Consequences
- Positivas: un toolchain; tipos desde contratos.
- Negativas: si se necesita procesamiento de lenguaje en Python (p. ej. detectores DLP), se aísla como componente del worker.

## Risks
- Elegir por preferencia y no por el equipo → la decisión espera a OD-10.

## Revisit Triggers
Al confirmar el equipo y tras el prototipo del editor.

# ADR-013: Stack de aplicación — TypeScript de extremo a extremo frente a TypeScript + Python (FastAPI)

- **Status:** Accepted (solo stack)
- **Date:** 2026-11-22
- **Deciders:** propietario del producto (decisión de stack, 2026-11-22)
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
**Aceptada por el propietario para el stack:** React y TypeScript en la web; NestJS y TypeScript en la API; núcleo Rust separado detrás de una interfaz explícita. PostgreSQL con RLS, JSONB, pgvector y btree_gist; migraciones por contexto. Monorepo con pnpm workspaces. OpenAPI 3.1, AsyncAPI 3.0 y JSON Schema de `docs/contracts/` son la fuente de contratos y tipos generados. Integración y concurrencia se prueban con PostgreSQL real en contenedor.

La forma de integración con Rust y SPA o SSR se decidirán con evidencia durante la implementación. Equipo, proveedores, versiones, licencias y algoritmo AEAD siguen pendientes; esta aceptación no aprueba otros ADR.

## Consequences
- Positivas: TypeScript compartido para web y API; límites modulares y tipos derivados de contratos.
- Negativas: Rust introduce un segundo toolchain y requiere definir y probar su interfaz.

## Risks
- La composición del equipo sigue pendiente; validar que puede mantener ambos toolchains.

## Revisit Triggers
Al confirmar el equipo, definir la interfaz Rust y tras el prototipo del editor.

# ADR-001: Estilo arquitectónico inicial — monolito modular con contextos delimitados

- **Status:** Proposed (no validado por el propietario)
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [04 §2, §5, §12](../04-Software-Architecture.md) · FR-PLN-02, FR-PLN-05, FR-MEM-01, NFR-MNT-01, INV-01, INV-07

## Context
El MVP debe validar valor pedagógico antes de ampliar infraestructura (S26 Etapa 1, S28 R7). Las operaciones núcleo —aceptar un patch, aprobar una sección, registrar el `DecisionEvent` y encolar el evento de dominio— deben ser **atómicas** para que se cumplan INV-01 e INV-07. El dominio tiene fronteras claras y el equipo inicial es pequeño (OD-10).

## Decision Drivers
- Atomicidad entre aprobación, versión, evento y outbox (INV-01, INV-07, FR-MEM-01).
- Complejidad operativa acorde a un equipo pequeño y a un piloto (S26, S28 R7).
- Posibilidad de extraer servicios sin rediseño (NFR-MNT-01).
- Restricción del encargo: no proponer microservicios en el MVP sin demostrar necesidad.

## Considered Options
1. **Monolito modular**: un artefacto desplegable en dos roles (`api`, `worker`); módulos con API pública y tablas propias.
   - Pros: transacciones locales; un pipeline de despliegue y observabilidad; refactor barato; extracción posterior posible si se respetan los límites.
   - Contras: exige disciplina de límites (verificable en CI); los módulos escalan juntos.
2. **Microservicios desde el inicio.**
   - Pros: despliegue y escalado independientes; aislamiento de fallos.
   - Contras: las operaciones atómicas pasan a ser sagas distribuidas; red, versionado de contratos y observabilidad distribuida desde el día 1; ningún requisito del MVP exige escalado independiente.
3. **Monolito en capas técnicas, sin módulos.**
   - Pros: arranque rápido.
   - Contras: acoplamiento implícito; extraer contextos y hacer cumplir la propiedad de datos se vuelve costoso.

## Decision
**Propuesta:** opción 1, con siete contextos y un kernel de plataforma (04 §5); comunicación solo por puertos permitidos y eventos vía outbox (ADR-005); verificación de dependencias en CI (NFR-MNT-01).

## Consequences
- Positivas: INV-01 e INV-07 se garantizan con una transacción local; menor superficie operativa.
- Negativas: un defecto de recursos puede afectar a toda la API (se mitiga separando el `worker` y con límites de recursos).

## Risks
- Erosión de límites entre módulos → verificador de dependencias en CI y propiedad de esquemas por contexto (04 §9).

## Revisit Triggers
Extraer un contexto si: (a) las métricas del piloto muestran que su carga requiere escalado independiente; (b) su ciclo de despliegue choca con el resto; (c) un requisito de seguridad o legal exige aislarlo. Candidatos: AI Orchestration, Agent Execution, Identity Vault (04 §12).

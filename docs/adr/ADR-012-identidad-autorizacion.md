# ADR-012: Identidad y autorización — IdP OIDC + PDP interno RBAC/ABAC con RLS; ReBAC limitado

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [09 §6](../09-Security-Privacy.md) · FR-IAM-01, FR-IAM-02, FR-IAM-03, FR-IAM-04, FR-IAM-06, EIR-02, NFR-SEC-02

## Context
Cuentas individuales e institucionales, MFA/passkeys, SSO institucional, concesiones explícitas y la regla de que un rol institucional no da acceso a lo privado del docente (S09 J4, S12, S23). La autorización depende del rol, del propósito, del grupo y del estado del recurso.

## Decision Drivers
- Estándares abiertos (OIDC, OAuth 2.x) y no construir autenticación propia.
- Expresar reglas por atributos (propósito, grupo, propietario, estado) además de roles.
- Revocación efectiva en tareas en curso (FR-IAM-06).
- Verificabilidad con pruebas IDOR/BOLA (NFR-SEC-02).

## Considered Options
1. **IdP OIDC externo** (Keycloak autoalojado o servicio gestionado) + **PDP interno** RBAC + ABAC + `Grant`, con RLS como red de seguridad.
   - Pros: MFA, passkeys y SSO provistos por el IdP; las reglas del dominio quedan en el dominio.
   - Contras: operar o contratar el IdP; mantener el PDP.
2. **Autenticación propia.**
   - Pros: control total.
   - Contras: reimplementar MFA, passkeys, recuperación de cuenta y federación; riesgo alto.
3. **Motor ReBAC completo** (estilo Zanzibar, p. ej. OpenFGA).
   - Pros: modelado potente de compartición.
   - Contras: componente adicional; el MVP solo necesita compartición explícita simple.

## Decision
**Propuesta:** opción 1. La elección del IdP queda en OD-04. `Grant` cubre la compartición explícita; se reevalúa ReBAC si el modelo de compartición institucional crece.

## Consequences
- Positivas: estándares y MFA; política testeable.
- Negativas: dos capas de autorización (PDP y RLS) que deben ser coherentes.

## Risks
- Inconsistencia PDP vs RLS → pruebas que verifican ambas capas con los mismos casos.

## Revisit Triggers
Etapa 2, según la complejidad real de compartición en cuentas institucionales.

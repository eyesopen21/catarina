# ADR-022: Claves y secretos — KMS/HSM + gestor de secretos (servicio de la nube o Vault)

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [09 §7–8](../09-Security-Privacy.md) · FR-STU-01, FR-AIO-05, SPR-02, SPR-03, NFR-SEC-01

## Context
Se requiere envelope encryption para la identidad estudiantil (ADR-006), almacenamiento de claves BYOK y credenciales de integración, rotación y auditoría de uso (S23: secrets manager y KMS).

## Decision Drivers
- Auditoría del uso de claves y rotación (SPR-02, SPR-03).
- Crypto-shredding para borrado (DAT-03).
- Portabilidad frente a residencia de datos (OD-03).
- Operación con un equipo pequeño.

## Considered Options
1. **KMS y gestor de secretos del proveedor de nube.**
   - Pros: servicio gestionado; auditoría integrada; respaldo por HSM según el proveedor.
   - Contras: dependencia del proveedor.
2. **HashiCorp Vault u otra opción autoalojada.**
   - Pros: portable entre nubes.
   - Contras: Vault mismo debe operarse con alta disponibilidad y respaldos.
3. **Claves en variables de entorno o archivos.**
   - Pros: ninguno relevante.
   - Contras: incumple SPR-03.

## Decision
**Propuesta:** KEK en un KMS respaldado por HSM y secretos en un gestor dedicado; la elección entre 1 y 2 depende de la nube y la residencia (OD-03, OD-10).

## Consequences
- Positivas: rotación, auditoría y borrado criptográfico.
- Negativas: dependencia de la disponibilidad del KMS.

## Risks
- KMS no disponible → caché de DEK descifradas de vida corta en memoria y runbook de recuperación.

## Revisit Triggers
Al decidir nube y región.

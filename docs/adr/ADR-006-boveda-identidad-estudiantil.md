# ADR-006: Identidad estudiantil — bóveda separada, IDs opacos y AEAD con claves envolventes

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario, con asesoría de seguridad y legal
- **Relacionado:** [06 §6](../06-Data-Architecture.md), [09 §7](../09-Security-Privacy.md) · FR-STU-01, FR-STU-02, FR-STU-03, INV-06, SPR-02, SPR-09, DAT-03

## Context
Los datos de menores son los más sensibles del sistema (S23). S06 y S23 piden separar identidad y perfil pedagógico, cifrar con claves de KMS y no usar hashes como mecanismo de reidentificación ni de autorización.

## Decision Drivers
- Segregación y mínimo privilegio (INV-06, FR-STU-02).
- Borrado efectivo, también en backups (DAT-03, SPR-07).
- Evitar reidentificación por diccionario: el hash de un nombre se recalcula probando nombres comunes.
- Costo operativo razonable en el MVP.

## Considered Options
1. **Esquema `vault` separado** con rol de BD propio; `student_ref` aleatorio; ciphertext AEAD con AAD (`tenant_id‖student_ref‖schema_version`); DEK por tenant envuelta por una KEK en KMS/HSM.
   - Pros: frontera de acceso propia; crypto-shredding al destruir la DEK; el AAD impide mover ciphertext entre tenants o estudiantes sin detectarlo.
   - Contras: descifrado en servidor para mostrar nombres; dependencia de la disponibilidad del KMS.
2. **Columna cifrada en las tablas pedagógicas.**
   - Pros: simple.
   - Contras: misma frontera de acceso que los datos pedagógicos; consultas y backups amplios incluyen identidad.
3. **Servicio de identidad independiente desde el inicio.**
   - Pros: aislamiento máximo.
   - Contras: costo operativo en el MVP; queda como evolución (04 §12).

## Decision
**Propuesta:** opción 1. Sin índice de búsqueda por nombre en el MVP: el docente trabaja con el roster de su grupo, descifrado en memoria efímera. El algoritmo AEAD (p. ej. AES-256-GCM o XChaCha20-Poly1305) se confirma con asesoría de seguridad (OD-10).

## Consequences
- Positivas: reidentificación solo vía `VaultService` + autorización + auditoría; borrado criptográfico.
- Negativas: sin búsqueda global por nombre en el MVP.

## Risks
- Pérdida de claves = pérdida de datos → respaldo y recuperación de claves en el runbook.
- Reidentificación por combinación de atributos pedagógicos → DLP y agregación mínima (07 §9, OD-05).

## Revisit Triggers
Extraer la bóveda a un servicio con BD y KMS propios al activar perfiles individuales (Etapa 4) o si la validación legal lo exige.

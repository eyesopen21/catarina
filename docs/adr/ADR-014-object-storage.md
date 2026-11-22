# ADR-014: Almacenamiento de objetos compatible con S3, versionado y con claves por contenido

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [08 R-08](../08-Concurrency-Consistency.md) · FR-PLN-11, NFR-REL-01, NFR-PORT-01, SPR-07

## Context
Exports, anexos binarios, imágenes y adjuntos requieren almacenamiento duradero, cifrado y con retención (S07, S10). Los metadatos viven en PostgreSQL; objeto y metadatos no comparten transacción.

## Decision Drivers
- Portabilidad entre proveedores (NFR-PORT-01).
- Cifrado en reposo y retención (SPR-07).
- Consistencia objeto–metadatos ante fallos parciales (08 R-08).

## Considered Options
1. **Almacén compatible con la API S3**, con versionado, cifrado del lado del servidor con KMS y claves direccionadas por hash del contenido.
   - Pros: API de facto disponible en nubes y en soluciones autoalojadas; el hash permite verificar integridad y deduplicar.
   - Contras: protocolo propio para consistencia con la BD.
2. **BLOBs en PostgreSQL.**
   - Pros: transaccional con los metadatos.
   - Contras: crecimiento de la BD; backups y restauraciones más pesados.
3. **Sistema de archivos local.**
   - Pros: simple.
   - Contras: sin durabilidad ni replicación; incompatible con varias réplicas.

## Decision
**Propuesta:** opción 1. Protocolo: escribir primero el objeto (clave = hash), luego la fila de metadatos en la transacción del dominio; un proceso de limpieza elimina objetos huérfanos. El proveedor se decide con OD-10.

## Consequences
- Positivas: portable; integridad verificable.
- Negativas: necesita limpieza de huérfanos.

## Risks
- Objetos huérfanos tras fallos → limpieza periódica (08 R-08).

## Revisit Triggers
Al elegir proveedor y región (OD-03, OD-10).

# ADR-002: Almacén primario — PostgreSQL con JSONB, RLS y pgvector

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [06](../06-Data-Architecture.md) · INV-01, INV-05, INV-11, DAT-01, DAT-02, NFR-PORT-01, SPR-01

## Context
El sistema necesita transacciones e integridad referencial (aprobaciones, versiones, eventos), aislamiento por tenant como defensa en profundidad (INV-05), contenido semiestructurado por tipo de sección (FR-PLN-01), restricciones temporales (DAT-02) y recuperación semántica sobre contenido sin PII (07 §7).

## Decision Drivers
- Invariantes exigibles en la BD: índices únicos parciales (INV-11), triggers (INV-01), restricciones de exclusión temporal (DAT-02).
- Aislamiento en el motor con Row-Level Security y `FORCE ROW LEVEL SECURITY`, además de la aplicación (SPR-01).
- Un solo sistema de registro para backup, restauración y portabilidad (NFR-REL-01, NFR-PORT-01).
- Recuperación vectorial sin un segundo almacén en el MVP.

## Considered Options
1. **PostgreSQL** con `jsonb`, RLS, `pgvector` y `btree_gist`.
   - Pros: una transacción cubre versión + aprobación + evento + outbox; RLS nativo; índices parciales y exclusión; disponible gestionado y autoalojable (portabilidad).
   - Contras: búsqueda vectorial menos especializada que motores dedicados; depende de que el proveedor ofrezca las extensiones.
2. **PostgreSQL + base vectorial dedicada.**
   - Pros: motor optimizado para similitud a gran escala.
   - Contras: segundo almacén con su propia frontera de autorización y sincronización; los derivados se invalidan en dos sitios (DAT-04).
3. **Base documental + base vectorial.**
   - Pros: esquema flexible.
   - Contras: INV-01 e INV-11 quedan solo en la aplicación; sin equivalente directo a RLS.

## Decision
**Propuesta:** opción 1 como único sistema de registro del MVP; `jsonb` validado con JSON Schema en la aplicación; `pgvector` solo para embeddings sin PII; RLS obligatorio (ADR-020).

## Consequences
- Positivas: invariantes en la capa más baja posible; una estrategia de backup y PITR.
- Negativas: la recuperación vectorial a gran volumen no está probada en este dominio; hay que medirla.

## Risks
- Proveedor gestionado sin `pgvector` o `btree_gist` → verificar antes de elegir nube (OD-10).

## Revisit Triggers
Evaluar un motor vectorial dedicado si las pruebas de carga del piloto muestran que la recuperación híbrida incumple NFR-PERF-01 con índices optimizados.

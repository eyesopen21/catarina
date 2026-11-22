# ADR-020: Multi-tenancy — esquema compartido con `tenant_id` + RLS; esquema por tenant diferido

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [06 §5](../06-Data-Architecture.md) · FR-IAM-01, FR-MEM-06, INV-05, SPR-01, NFR-SEC-03

## Context
Hay tenants individuales (potencialmente miles de docentes) e institucionales. El aislamiento debe ser fuerte y verificable (S23, S25 G06). Dentro de un tenant institucional, además, el docente conserva privacidad frente a la institución (S09 J4).

## Decision Drivers
- Aislamiento entre tenants y, dentro del tenant, entre docentes y grupos.
- Escalar a muchos tenants pequeños sin multiplicar esquemas ni conexiones.
- Migraciones simples.
- Borrado y portabilidad por tenant (NFR-PORT-01).

## Considered Options
1. **Esquema compartido + `tenant_id` + RLS con `FORCE`**, más ABAC en la aplicación.
   - Pros: escala a muchos tenants; una sola migración por cambio.
   - Contras: una política RLS defectuosa afecta a todos → pruebas adversariales continuas.
2. **Esquema por tenant.**
   - Pros: aislamiento más fuerte a nivel de catálogo.
   - Contras: miles de esquemas complican migraciones y pooling de conexiones.
3. **Base de datos por tenant.**
   - Pros: aislamiento máximo.
   - Contras: costo inviable para docentes individuales.

## Decision
**Propuesta:** opción 1. Opción 3 como posible oferta futura para instituciones con requisitos contractuales especiales.

## Consequences
- Positivas: simplicidad y escala; defensa en profundidad con el PDP.
- Negativas: depende de configurar correctamente RLS y roles.

## Risks
- Roles con `BYPASSRLS` o funciones `SECURITY DEFINER` mal usadas → inspección y prueba que enumera tablas y políticas (INV-05).

## Revisit Triggers
Una institución con requisito contractual de aislamiento físico.

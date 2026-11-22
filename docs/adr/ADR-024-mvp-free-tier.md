# ADR-024: MVP demostrable en free tiers y ruta de migración a servicios pagos

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — H-PO / H-TL
- **Relacionado:** [14 — MVP Free Tier Architecture](../14-MVP-Free-Tier-Architecture.md); ADR-001, ADR-002, ADR-006, ADR-008, ADR-012, ADR-013, ADR-015, ADR-019, ADR-020, ADR-022; [12 — Decisiones abiertas](../12-Open-Decisions.md) (OD-03/04/09/10/11/15/16); [13 — WBS](../13-WBS-Agentes.md) (WP-01/02/03/10).

## Context

Se necesita un **MVP demostrable** ejecutable sin coste para mostrar el flujo completo de la intención docente al material aprobado, sin comprometer los ADR existentes ni los contratos (que permanecen `Proposed`). El documento [14](../14-MVP-Free-Tier-Architecture.md) propone la arquitectura: web estática → borde → API NestJS → PostgreSQL con esquemas por contexto e identidad → objetos → cola/outbox → observabilidad → adaptador IA simulado, con PDP en servidor y `FORCE RLS` en base de datos.

El problema no es solo económico: varios tiers gratuitos tienen límites que afectan directamente a la idoneidad del piloto (cold starts, pausas, ausencia de PITR, región fija, cláusulas de uso no comercial). Además, la validación de `asyncapi.yaml` sigue **bloqueada por telemetría externa** en revisión automática (bloqueo B2 en [contracts/README.md](../contracts/README.md)); este ADR no habilita ninguna ruta para eludir ese rechazo.

**Fuentes consultadas y verificadas el 2026-11-22** (lo no confirmado se marca *pendiente de verificar*):

- Web/borde: `developers.cloudflare.com/workers/static-assets/`, `/workers/platform/limits/`, `/workers/platform/pricing/` — assets ilimitados, 100k req/día, 10 ms CPU, 128 MB, bundle 64 MiB, startup 1 s; sin tarjeta y sin cláusula personal/no comercial en términos consultados. `vercel.com/legal/terms` — Hobby ToS §4 (19-oct-2026) prohíbe uso personal/no comercial. GitHub Pages: 1 GB, 100 GB/mes *soft limit*.
- API: `render.com/docs/free` — 0.1 CPU/512 MB, 750 h/mes por workspace, 5 GB egress, 500 min build, spin-down 15 min (~1 min cold start), disco efímero, «no usar para producción»; sin tarjeta (*pendiente de verificar* el literal). `docs.nestjs.com/faq/cloudflare-workers` — «Nest doesn't officially support it»; `developers.cloudflare.com/workers/runtime-apis/nodejs/http/`.
- BD: `neon.com/pricing`, `supabase.com/pricing`, `/docs/guides/platform/backups` — Neon: 100 CU-h/proyecto/mes, 1 GB/proyecto, 20 GB total, 5 GB egress, sin PITR de días, 8 regiones AWS; Supabase: 500 MB BD, pausa ~7 días, sin backups ni PITR (add-on ~$100/mes), SAML SSO no incluido. `btree_gist` confirmado en Neon, *pendiente de verificar* en Supabase.
- Identidad: `supabase.com/pricing`, `/docs/guides/auth/auth-mfa` — 50.000 MAU, OAuth 2.1 Server, Custom Access Token Hook, MFA TOTP real (`aal`/`amr`), logs 24 h; SSO de pago/experimental.
- Objetos: `developers.cloudflare.com/r2/pricing/`, `/r2/reference/data-security/` — 10 GB-mes, 1M/10M ops, egress gratis, AES-256 GCM, sin versionado nativo.
- IA: `developers.cloudflare.com/workers-ai/platform/pricing/`, `/data-usage/` — 10.000 Neurons/día, retención cero/sin entrenamiento, 300 req/min texto, 3.000 embeddings; región/residencia *pendiente de verificar*.
- Colas: `developers.cloudflare.com/queues/platform/pricing/` — 10k ops/día, retención 24 h no configurable; docs/08 §7 para el patrón outbox/`processed_event`/lease/fencing/`(task_id, step_key)`.
- Observabilidad: `grafana.com/pricing` — Grafana Cloud Free $0, 10k series, 50 GB ingesta, 14 días retención, sin tarjeta.
- CI: `docs.github.com/en/billing/...` — runners y GHAS gratis en repositorio público; SCA/SAST/SBOM/escáneres ya en CI.

## Decision Drivers

- Obtener una demo ejecutable y verificable sin coste ni tarjeta (OD-09), sin comprometer datos reales.
- Mantener la integridad de la arquitectura aprobada como propuesta: monolito modular, PostgreSQL con RLS/JSONB/pgvector, bóveda de identidad, outbox, PDP y observabilidad sin PII (ADR-001/002/006/008/012/013/015/019/020/022).
- Que la «gratuidad» no se confunda con disponibilidad, backups, residencia ni seguridad: OD-03 y la validación legal de docs/09 §14–15 son previas al piloto.
- Exigir evidencia antes de afirmar compatibilidad: la ejecución de NestJS en Cloudflare Workers requiere **POC obligatoria**.
- Trazabilidad con WP-01/02/03/10 y TC-NFR-MNT-01, TC-NFR-PRV-01, TC-SPR-03/08, TC-NFR-SEC-01 (**abierto**).
- No cambiar el estado de los ADR existentes (OD-15) ni congelar `docs/contracts/**` (Proposed; AsyncAPI bloqueado).

## Considered Options

1. **Free tiers para todo el ciclo** (demo, piloto y producción).
   - Pros: coste cero inmediato.
   - Contras: sin PITR multidía, cold start ~1 min, pausa ~7 días, región fija, BYPASSRLS y KMS sintético; ToS de Vercel Hobby incompatible con docentes. Descartada.
2. **Free tiers solo para la demo con datos sintéticos + migración formal a planes pagos para el piloto y producción** ([14](../14-MVP-Free-Tier-Architecture.md) §A–F).
   - Pros: demostrabilidad sin coste; separación clara de entornos; migración reversible y verificable por hashes/contajes; repetición de IDOR/BOLA/RLS tras el cutover.
   - Contras: requiere disciplina de puertos de salida y ejecutar la POC de NestJS en Workers antes de considerar esa variante.
3. **NestJS directamente en Cloudflare Workers** (instead of Render Free).
   - Pros: mismo borde para web y API; Workers Paid $5/mes.
   - Contras: FAQ oficial sin soporte; `httpServerHandler` + `nodejs_compat`, ~500 KB gzip, bootstrap por isolate, 10 ms CPU y 1 s startup. **Solo tras POC obligatoria.**
4. **Vercel Hobby para la web del piloto.**
   - Pros: DX conocida.
   - Contras: ToS §4 (19-oct-2026) prohíbe uso personal/no comercial → **NO apto** para piloto con docentes. Descartada.
5. **Supabase Free como BD principal en lugar de Neon Free.**
   - Pros: misma cuenta que Auth/Storage.
   - Contras: 500 MB BD, pausa ~7 días, sin PITR (add-on ~$100/mes), `btree_gist` pendiente de verificar. Queda como alternativa local, no recomendada para el MVP.

## Decision

**Propuesta:** adoptar la **opción 2**. Desplegar el MVP demostrable con datos **sintéticos** sobre free tiers (Cloudflare Workers Static Assets + R2, Neon Free, Supabase Auth Free, Render Free, PostgreSQL + outbox, OTel/Jaeger o Grafana Cloud Free, Mailpit, LocalStack KMS, `LLMProvider` determinista) y migrar a planes pagos **antes** de cualquier piloto con datos reales, siguiendo el procedimiento de export canónico con SHA-256, manifest firmado (solo `keyRef`), verificación de hashes/contajes, cutover con el proveedor anterior en solo lectura y repetición de IDOR/BOLA/RLS.

Condiciones explícitas de esta propuesta:

- La ejecución de NestJS en Cloudflare Workers queda **condicionada a una POC obligatoria**; hasta entonces la API es Render Free con NestJS escuchando `0.0.0.0:$PORT`.
- El SSO institucional y el adaptador IA son **simulados** en la demo; el modelo nunca produce decisiones C4 y su salida se etiqueta como simulación.
- `tenant_id` se toma **siempre del token verificado**, nunca del cliente; PDP en servidor y `FORCE RLS` probado con rol no dueño (los roles con `BYPASSRLS` invalidan la prueba).
- Ningún ADR existente cambia de estado; **todos siguen `Proposed`** (OD-15). Los contratos en `docs/contracts/**` siguen **Proposed** y AsyncAPI permanece bloqueado por telemetría.
- **Deciders pendientes — H-PO / H-TL.** Esta propuesta no cierra gates ni acepta ADR; la adopción requiere validación humana.

## Consequences

- **Positivas:** demo ejecutable sin coste ni tarjeta; separación nítida entre demo sintética, piloto real y producción; sustitución de proveedores mediante puertos de salida sin tocar reglas de dominio; migración auditable por hashes y reversible; trazabilidad explícita con WP y TC.
- **Negativas:** el MVP no ofrece backups/PITR multidía, SLA ni residencia garantizada; el piloto real exige planes pagos, DPIA/legal y KMS/HSM; la POC de Workers consume esfuerzo adicional; Mailpit, LocalStack y el stub DLP son simulaciones insuficientes para datos reales.
- **Neutras:** la compatibilidad NestJS/Workers no se afirma hasta la POC; `btree_gist` en Supabase y la región de Workers AI quedan *pendientes de verificar*.

## Risks

- Confundir el tier gratuito con aptitud para producción (disponibilidad, PITR, residencia y seguridad).
- Aplicar la política de Vercel Hobby a un piloto con docentes (ToS §4, 19-oct-2026).
- Medir cuotas solo al inicio: 100 CU-h, 1 GB, 5 GB egress, 100k req/día, 10 ms CPU y 750 h Render pueden agotarse durante la demo.
- `BYPASSRLS` en roles administrativos invalida la prueba de `FORCE RLS` (TC-NFR-SEC-01 sigue **abierto**).
- Clave sintética de LocalStack (45/56 ops) interpretada como KMS/HSM real (ADR-022).
- Cuotas y ToS cambien después del 2026-11-22: requiere reverificación antes de cada hito.

## Revisit Triggers

- **Cuota:** agotamiento de 100 CU-h/proyecto/mes, 1 GB/proyecto, 5 GB egress, 100k req/día, 10 ms CPU o 750 h/mes en Render.
- **Backups:** necesidad de PITR/backups multidía para el piloto (los tiers free no lo incluyen).
- **Disponibilidad:** cold start ~1 min de Render Free o pausa ~7 días de Supabase Free; scale-to-zero de 5 min no desactivable en Neon.
- **Residencia (OD-03):** región fija al crear en Neon, región/residencia de Workers AI pendiente de verificar, o requerimiento legal nuevo.
- **Uso comercial:** cualquier piloto con docentes bajo ToS que prohíba uso personal/no comercial (Vercel Hobby §4).
- **Seguridad:** detección de `BYPASSRLS`, clave sintética en lugar de KMS/HSM, o cierre de TC-NFR-SEC-01/TC-SPR-03/08 con hallazgos.
- **Coste:** Neon Launch ~$15/mes, Supabase Pro $25 + PITR $100/mes o Cloudflare Workers Paid $5/mes resulten preferibles a los límites medidos.
- **POC:** resultado de la prueba de NestJS en Cloudflare Workers (acepta o descarta la opción 3).
- **Gates humanos:** decisión de H-PO/H-TL sobre OD-03/04/09/11/15 o cambio de estado de cualquier ADR.

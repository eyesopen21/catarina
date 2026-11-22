# 08 — Concurrencia, consistencia y tolerancia a fallos

**Versión:** 0.1-draft · **Estado:** Draft (propuesta) · **Fecha:** 2026-11-22
**Dependencias:** [03 §3](03-Domain-Model-Pedagogy.md), [06](06-Data-Architecture.md), [07 §4–5](07-AI-Agentic-Architecture.md), ADR-004/005/008 · **Alimenta:** [10 §4](10-Test-Strategy.md)
**Decisiones pendientes:** OD-10 (proveedor de BD: niveles de aislamiento y extensiones disponibles)

## 1. Metodología

Para cada condición: escenario concreto → invariante en riesgo → mecanismo de protección → respuesta observable → prueba reproducible. Las protecciones se ubican en la capa más baja que pueda garantizarlas (BD > agregado > API). Todo el estado autoritativo vive en PostgreSQL; por eso el MVP no necesita locks distribuidos (ADR-005).

## 2. Catálogo de condiciones

| ID | Condición | Invariante en riesgo | Mecanismo principal |
|---|---|---|---|
| R-01 | Lost update en edición concurrente | Contenido del docente | OCC: `row_version` + ETag/If-Match |
| R-02 | Write skew sobre invariantes | INV-11, estado derivado del plan | Índices únicos parciales; lock de fila de la raíz `lesson_plan` |
| R-03 | Salida obsoleta de agente | INV-01, FR-PLN-03 | `base_version_id` en `Patch` + CAS al aceptar |
| R-04 | Aprobación vs modificación | INV-01, INV-02 | Aprobación sobre `artifact_version_id` + CAS sobre estado y versión |
| R-05 | Ejecución duplicada de tareas | FR-AGX-07 | Lease con fencing token; UQ `(task_id, step_key)` |
| R-06 | Escrituras concurrentes de memoria | INV-03, INV-11 | CAS + UQ parcial de hecho confirmado vigente |
| R-07 | Revocación de permisos durante ejecución | FR-IAM-06 | `authz_version` + rechequeo por paso/herramienta |
| R-08 | Fallos parciales BD / objetos / workflow | FR-PLN-11, consistencia de export | Objeto primero con clave de contenido; outbox; compensación |
| R-09 | Reintentos con efectos laterales | FR-API-03, FR-API-06 | `Idempotency-Key`; consumidores idempotentes; dedup por `event_id` |
| R-10 | Actualización simultánea del grafo | INV-08, DAT-02 | Proyección idempotente; restricción de exclusión temporal; upsert |

## 3. Primitivas

| Primitiva | Uso en este sistema |
|---|---|
| **Optimistic Concurrency Control** | `row_version bigint` en toda entidad mutable; `ETag: W/"<row_version>"`; `If-Match` obligatorio (FR-API-02) |
| **Compare-and-swap** | `UPDATE … SET …, row_version = row_version + 1 WHERE id = :id AND row_version = :expected [AND state IN (…)]`; 0 filas afectadas = conflicto |
| **Aislamiento** | `READ COMMITTED` por defecto; `SELECT … FOR UPDATE` sobre la raíz de agregado para transiciones que leen varias filas; `SERIALIZABLE` + reintento ante `40001` solo donde se documente |
| **Transiciones atómicas** | Cambio de estado + nueva versión + `DecisionEvent` + `OutboxEvent` en **una** transacción |
| **Transactional outbox** | Evento insertado en `plt.outbox_event` en la misma transacción; un relay lo publica y marca `published_at` |
| **At-least-once + dedup** | Consumidores registran `(consumer, event_id)` en `plt.processed_event` en la misma transacción que su efecto |
| **Idempotency keys** | API (05 §7) y efectos de agentes `(task_id, step_key)` |
| **Leases con fencing** | Tareas: `lease_owner`, `lease_expires_at`, `fencing_token` monotónico |
| **Locks distribuidos** | **No** se usan en el MVP (ADR-005) |
| **Saga / compensación** | Solo para export (objeto + metadatos) y borrado en cascada de derivados |
| **Retry con backoff exponencial y jitter** | Llamadas a proveedores, relay del outbox, webhooks y tareas |
| **Dead Letter Queue** | Tareas `dead_lettered`; eventos de webhook agotados, visibles y reprocesables |

## 4. Análisis por condición

### R-01 Lost update en edición concurrente
**Escenario:** el docente edita la misma sección `draft` en dos pestañas; la segunda escritura pisaría la primera.
**Protección:** cada escritura de contenido crea una `ArtifactVersion` nueva con CAS sobre `plan_section.row_version`; la API exige `If-Match`.
**Respuesta:** la segunda escritura recibe `412 precondition-failed` con el ETag actual; la UI muestra el diff entre ambas versiones y el docente elige.
**Prueba:** dos clientes leen el ETag `v` y escriben concurrentemente con `If-Match: v` → exactamente una `200`, una `412`; el historial tiene una sola versión nueva.

### R-02 Write skew sobre invariantes
**Escenario A (aprobaciones):** dos solicitudes aprueban la misma versión a la vez; cada una comprueba «no hay aprobación activa» y ambas insertan.
**Protección A:** índice único parcial `approval(artifact_version_id) WHERE status='active'` (INV-11); la segunda inserción falla y se traduce a `409`.
**Escenario B (estado del plan):** dos secciones se aprueban en paralelo; cada transacción ve la otra como no aprobada y ninguna deriva `approved` para el plan (o, a la inversa, una reapertura concurrente deja el plan marcado `approved` con una sección abierta).
**Protección B:** toda transición de estado de sección toma `SELECT … FOR UPDATE` sobre la fila `lesson_plan` antes de recalcular el estado derivado; las transiciones del mismo plan se serializan; el lock dura solo la transacción.
**Prueba:** N aprobaciones/reaperturas concurrentes aleatorias sobre un plan; al final el estado del plan coincide con la función de derivación sobre las secciones (propiedad), y nunca hay dos aprobaciones activas por versión.

### R-03 Salida obsoleta de agente
**Escenario:** una tarea genera un patch sobre la versión 3 del desarrollo; mientras tanto el docente edita a la versión 4.
**Protección:** el `Patch` guarda `base_version_id`; `accept_patch` hace CAS `WHERE current_version_id = :base_version_id`. Al crearse una versión nueva o aprobarse la sección, los patches pendientes de esa sección pasan a `stale` (evento `PatchStale`) en la misma transacción.
**Respuesta:** `409 patch-stale`; la UI ofrece pedir una nueva propuesta sobre la versión actual. Nunca se aplica un rebase automático silencioso.
**Prueba:** crear patch sobre `v3`, escribir `v4`, aceptar el patch → `409` y patch `stale`; contenido sigue en `v4`.

### R-04 Aprobación vs modificación
**Escenario:** el docente aprueba la versión que ve mientras un patch aceptado en otra sesión cambia la versión actual; o se acepta un patch sobre una sección que se está aprobando.
**Protección:** `approve` envía `artifact_version_id`; el UPDATE es `SET state='approved', approved_version_id = current_version_id WHERE id = :id AND current_version_id = :artifact_version_id AND state IN ('draft','proposed','reopened') AND row_version = :expected`. `accept_patch` exige `state <> 'approved'`. Además, el trigger de INV-01 rechaza cambiar `current_version_id` si `state = 'approved'`.
**Respuesta:** la operación que pierde recibe `409`: `section-approved` si perdió el patch, `version-mismatch` si perdió la aprobación. El docente nunca aprueba algo distinto de lo que vio.
**Prueba:** ejecutar `approve(v3)` y `accept_patch(base v3 → v4)` concurrentemente con barreras; resultados válidos: (aprobado v3, patch `409 section-approved`) o (v4 actual, aprobación `409`). Ningún otro resultado es aceptable. Diagrama: [diagrams/seq-approval-race.md](diagrams/seq-approval-race.md).

### R-05 Ejecución duplicada de tareas
**Escenario:** el lease de un worker expira por una pausa larga (GC, red) y otro worker toma la misma tarea; ambos intentan confirmar efectos.
**Protección:** al tomar el lease, `fencing_token = fencing_token + 1`; cada escritura de efecto incluye `WHERE fencing_token = :mine`; los efectos llevan clave única `(task_id, step_key)` (p. ej. `Patch.task_id/step_key`).
**Respuesta:** el worker con token antiguo obtiene 0 filas o violación de unicidad y aborta sin efecto.
**Prueba:** congelar el worker A tras tomar el lease, expirarlo, dejar que B complete, reanudar A → un solo `Patch` y un solo `ToolInvocation` por paso.

### R-06 Escrituras concurrentes de memoria
**Escenario:** el docente confirma un hecho mientras la consolidación propone una versión actualizada del mismo predicado; o confirma dos candidatos contradictorios a la vez.
**Protección:** confirmar es CAS sobre `memory_fact.row_version` y `status='candidate'`; el índice único parcial de hecho `confirmed` vigente por `(scope, scope_ref, predicate_key)` impide dos confirmados simultáneos; reemplazar uno cierra `valid_to` del anterior (`superseded`) en la misma transacción; la consolidación nunca escribe `confirmed`.
**Respuesta:** `409` al segundo; la UI muestra el hecho vigente y ofrece reemplazarlo.
**Prueba:** dos confirmaciones concurrentes del mismo predicado → un solo `confirmed` vigente; con validez no solapada (DAT-02).

### R-07 Revocación de permisos durante la ejecución
**Escenario:** se revoca la membresía de un docente (o el acceso a un grupo) mientras su agente ejecuta una tarea larga.
**Protección:** la tarea guarda `authz_version_snapshot`; revocar incrementa `membership.authz_version` y emite `MembershipRevoked`; antes de **cada** paso con efecto, herramienta y recuperación de contexto, el supervisor reevalúa la autorización (decisiones de PDP con TTL corto, dentro de FR-IAM-06); los gates pendientes se invalidan; los tokens de sesión se revocan en el IdP.
**Respuesta:** la tarea pasa a `cancelled` con causa `authorization_revoked`; las propuestas ya creadas quedan visibles solo para quien conserve permiso.
**Prueba:** iniciar una tarea de N pasos, revocar en el paso k → ningún efecto posterior al chequeo siguiente; el tiempo entre revocación y corte queda dentro del objetivo de FR-IAM-06.

### R-08 Fallos parciales entre BD, objetos y workflow
**Escenario:** el export renderiza el documento, sube el objeto y falla antes de registrar los metadatos; o registra metadatos de un objeto que no llegó a subirse.
**Protección (saga corta):** (1) `ExportJob` en `rendering`; (2) subir objeto con clave = hash de contenido (idempotente); (3) en una transacción: metadatos + `status='stored'` + `DecisionEvent` + outbox `ExportCompleted`; (4) si (3) falla, el reintento rehace (2) sin duplicar (misma clave); (5) limpieza periódica de objetos sin metadatos tras un periodo de gracia. Un `ExportJob` nunca pasa a `stored` sin objeto verificado (HEAD + hash).
**Prueba:** inyectar fallos entre cada paso → tras reintentos: o export `stored` con objeto íntegro, o `failed` sin metadatos colgantes; los huérfanos se eliminan en la siguiente limpieza.

### R-09 Reintentos con efectos laterales
**Escenario:** el cliente reintenta `accept_patch` tras un timeout; el relay publica dos veces un evento; un webhook se reentrega.
**Protección:** `Idempotency-Key` registrada en la misma transacción que el efecto (05 §7); consumidores con `processed_event`; webhooks con `event_id` y firma; llamadas al proveedor de IA solo se reintentan si no producen efectos (generar texto es repetible; el efecto es crear el `Patch`, protegido por `(task_id, step_key)`).
**Prueba:** enviar la misma solicitud con la misma clave en paralelo y en serie → un efecto y respuestas idénticas; reprocesar el outbox completo → proyecciones sin cambios.

### R-10 Actualización simultánea del Knowledge Graph
**Escenario:** dos eventos (`SectionApproved` y `PatchAccepted` de otra sección) proyectan aristas relacionadas al mismo tiempo; un evento llega dos veces o fuera de orden.
**Protección:** consumidores idempotentes; upsert por clave natural `(scope, from, to, edge_type, valid_from)`; restricción de exclusión temporal (DAT-02); cada arista lleva `derived_from` (evento y versión) y se ignora un evento con versión anterior a la ya proyectada; el grafo se puede reconstruir desde la fuente de verdad.
**Prueba:** reproducir eventos en orden aleatorio y con duplicados → mismo grafo que la proyección en orden; nunca aristas público → privado.

## 5. Diagramas

| Flujo | Diagrama |
|---|---|
| Coautoría: propuesta, aceptación y aprobación | [seq-coauthoring-patch.md](diagrams/seq-coauthoring-patch.md) |
| Carrera aprobación vs modificación (R-04) | [seq-approval-race.md](diagrams/seq-approval-race.md) |
| Outbox y consumidores idempotentes (R-09, R-10) | [seq-outbox-delivery.md](diagrams/seq-outbox-delivery.md) |
| Ensamblaje de contexto y egress | [seq-context-assembly.md](diagrams/seq-context-assembly.md) |
| Estados de plan, sección, tarea y hecho de memoria | [state-plan.md](diagrams/state-plan.md), [state-plan-section.md](diagrams/state-plan-section.md), [state-task.md](diagrams/state-task.md), [state-memory-fact.md](diagrams/state-memory-fact.md) |

## 6. Modos de falla

| Falla | Efecto | Detección | Manejo |
|---|---|---|---|
| Proveedor de IA caído o lento | Sin generación | Circuit breaker, timeouts | Degradación L1/L2 (07 §9.5) |
| BD primaria no disponible | Sin escrituras | Health checks | Failover gestionado; RPO/RTO de NFR-REL-01 |
| Worker muere a mitad de tarea | Tarea detenida | Lease expirado | Otro worker retoma desde checkpoint (R-05) |
| Relay del outbox detenido | Proyecciones atrasadas | Edad del evento no publicado | Alerta; las proyecciones no son fuente de verdad |
| KMS no disponible | Sin descifrado de identidad | Errores del KeyService | El docente ve solo `student_ref`/alias; resto operativo |
| Almacén de objetos no disponible | Sin export | Errores de subida | Reintento; `ExportJob` permanece `rendering` o `failed` |
| Egress Proxy caído | Sin IA externa | Errores de conexión | Igual que proveedor caído (fail-closed) |

## 7. Pruebas reproducibles de concurrencia

- **Harness de barreras:** las pruebas de integración usan puntos de sincronización inyectables en los servicios (antes/después del CAS, del commit, de la subida) para forzar el entrelazado exacto de cada escenario.
- **Pruebas de propiedad con concurrencia:** secuencias aleatorias de operaciones (editar, proponer, aceptar, aprobar, reabrir, revertir) ejecutadas por varios actores sobre BD real; tras cada corrida se verifican INV-01, INV-02, INV-11 y la derivación del estado del plan.
- **Inyección de fallos:** cortar conexiones, matar el worker y expirar leases en los puntos de R-05 y R-08.
- **Reprocesamiento:** reproducir el outbox completo y en desorden para R-09 y R-10.
- Todas se ejecutan en CI contra PostgreSQL real (no simulado) y son condición de los gates de 11 §9.

## 8. Decisiones pendientes
OD-10: confirmar en el proveedor gestionado de PostgreSQL el soporte de `SERIALIZABLE`, `btree_gist` y la latencia de failover.

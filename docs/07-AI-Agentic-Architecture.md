# 07 — Arquitectura de IA y agentes

**Versión:** 0.1-draft · **Estado:** Draft (propuesta, no aprobada) · **Fecha:** 2026-11-22
**Dependencias:** [03](03-Domain-Model-Pedagogy.md), [04](04-Software-Architecture.md), [06](06-Data-Architecture.md), ADR-007/008/009/010/011/017/018 · **Alimenta:** [08](08-Concurrency-Consistency.md), [09](09-Security-Privacy.md), [10](10-Test-Strategy.md)
**Decisiones pendientes:** OD-03 (residencia y proveedores permitidos), OD-05, OD-09 (presupuesto), OD-10 (proveedores)

## 1. Principios

1. **La IA es una capa de soporte del dominio pedagógico.** El modelo propone; el docente decide (S01, S03). Ninguna salida del modelo cambia el estado del dominio sin pasar por los servicios de aplicación y sus invariantes.
2. **El conocimiento vive fuera del modelo.** Memoria, decisiones, reglas y versiones son datos propios (FR-AIO-01, FR-MEM-07); el proveedor es intercambiable.
3. **Determinista primero.** Validación curricular, numeración de anexos, alineación de indicadores, diff, impacto y export son código determinista (S19, S22). El LLM se usa donde aporta: redactar, idear, explicar, proponer.
4. **Mínimo contexto, máximo control.** El contexto se ensambla por propósito, con permisos, procedencia y vigencia (FR-AIO-02).
5. **Autonomía acotada.** Los agentes preparan y proponen; las acciones sensibles pasan por gates humanos (FR-AGX-03).
6. **Innovación justificada.** Agentes complejos, workflows durables y sandbox entran por etapa y con valor medido (S26, S28 R7).

## 2. Arquitectura Supervisor–Worker

Diagrama de componentes: [diagrams/c4-l3-ai-agents.md](diagrams/c4-l3-ai-agents.md).

| Rol | Responsabilidad | Qué puede hacer | Qué no puede hacer | Etapa |
|---|---|---|---|---|
| **Supervisor** (CMP-AGX-SUP) | Recibe la `Task`, elige el workflow, ejecuta pasos, gestiona checkpoints, gates y presupuesto | Invocar workers y herramientas permitidas; pedir aprobación | Aprobar, confirmar memoria, tocar `approved` | MVP (workflows cortos) |
| **Worker de coautoría** | Redacta propuestas de sección (estrategia, actividad, anexo, indicador) | Producir `Patch` propuesto vía `plan.propose_patch` | Escribir directamente secciones | MVP |
| **Worker curricular** | Explica hallazgos de reglas con citas | Leer currículo y hallazgos deterministas | Decidir cumplimiento | MVP |
| **Worker de memoria** | Propone hechos candidatos desde eventos y reflexiones | `memory.propose_fact` | Confirmar hechos | Etapa 2 |
| **Agente personal** | Organiza tareas documentales del docente | Workflows del docente con sus permisos | Actuar fuera del alcance del docente | Etapa 3 |
| **Groupbot** | Vista contextual de **un** grupo | Leer contexto del grupo; proponer | Ver identidad, otros grupos o credenciales | Etapa 3 |
| **Institution bot** | Tareas de centro (plantillas, biblioteca) | Recursos institucionales | Leer memoria privada de docentes | Etapa 3 |

Los «agentes» son configuraciones (`Agent`: tipo, allowlist de herramientas, política, presupuesto) que ejecutan workflows deterministas con pasos LLM; no son procesos autónomos que conversan entre sí (ADR-009).

## 3. Workflows deterministas frente a decisiones delegadas al LLM

Cada paso se clasifica como **D** (determinista, código), **L** (LLM con entrada/salida tipadas) o **H** (humano: docente o rol autorizado).

| Workflow | Pasos | D | L | H |
|---|---|---|---|---|
| **Borrador de sección** (FR-PLN-02) | 1 autorizar · 2 ensamblar contexto · 3 validar reglas · 4 redactar propuesta · 5 validar salida y esquema · 6 calcular diff e impacto · 7 crear `Patch` · 8 revisar y aceptar/rechazar | 1, 2, 3, 5, 6, 7 | 4 | 8 |
| **Revisión selectiva** («cambiá solo el desarrollo») | 1 interpretar alcance · 2 confirmar alcance con el docente · 3 congelar secciones no objetivo · 4 redactar · 5 validar · 6 impacto · 7 patches · 8 aceptar | 3, 5, 6, 7 | 1, 4 | 2, 8 |
| **Anexo** (FR-PLN-07) | 1 detectar actividad que requiere material · 2 redactar hoja del estudiante y solucionario · 3 validar completitud y título · 4 numerar · 5 revisar | 1, 3, 4 | 2 | 5 |
| **Indicadores** (FR-PLN-08) | 1 listar aprendizajes · 2 proponer indicador observable · 3 validar correspondencia · 4 revisar | 1, 3 | 2 | 4 |
| **Validación curricular** (FR-CUR-03) | 1 seleccionar reglas · 2 ejecutar validadores · 3 explicar hallazgos con cita | 1, 2 | 3 | — |
| **Export** (FR-PLN-11) | 1 validar INV-09/10 · 2 atestación · 3 render · 4 almacenar | 1, 3, 4 | — | 2 |
| **Consolidación de memoria** (FR-MEM-08) | 1 seleccionar eventos/reflexiones · 2 proponer candidatos · 3 deduplicar · 4 confirmar/rechazar | 1, 3 | 2 | 4 |

**Regla:** si un paso L falla, devuelve salida inválida o agota su presupuesto, el workflow **no** improvisa; marca el paso como fallido y aplica la política de degradación de §9.5.

## 4. Ciclo de vida del agente y máquina de estados de la tarea

Diagrama: [diagrams/state-task.md](diagrams/state-task.md).

**Ciclo de vida del `Agent`:** `provisioned → active → suspended → retired`. Se suspende automáticamente si el docente propietario pierde la membresía o si se revoca la allowlist (FR-IAM-06).

**Estados de `Task`:**

| Estado | Significado | Transiciones de salida |
|---|---|---|
| `queued` | Lista para ejecutarse | `leased`, `cancelled`, `expired` |
| `leased` | Un worker tomó el lease (con `fencing_token`) | `running`, `queued` (lease expirado) |
| `running` | Ejecutando pasos | `awaiting_approval`, `retry_wait`, `succeeded`, `failed`, `cancelled` |
| `awaiting_approval` | Gate humano pendiente | `running` (aprobado), `cancelled` (rechazado), `expired` |
| `retry_wait` | Error transitorio; espera con backoff y jitter | `queued`, `dead_lettered` |
| `succeeded` | Terminó; resultados como propuestas | — |
| `failed` | Error no recuperable | — |
| `dead_lettered` | Agotó reintentos; visible para operación | `queued` (reproceso manual) |
| `cancelled` | Cancelada por el docente o por revocación | — |
| `expired` | Superó su `deadline` | — |

Toda transición es un UPDATE condicional sobre `row_version` y, para el worker, sobre `fencing_token` (08 R-05).

## 5. Workflows durables y checkpointing

- **Checkpoint** tras cada paso con efecto: `Execution.checkpoint_ref` guarda el paso completado y las referencias de sus resultados (no el contenido del prompt).
- **Reanudación:** al reiniciarse, el worker toma la tarea desde el último checkpoint; los efectos ya confirmados se detectan por la clave única `(task_id, step_key)` y no se repiten (FR-AGX-07).
- **Reintentos:** solo para errores transitorios (timeout, `429`, `5xx` del proveedor), con backoff exponencial y jitter y número máximo configurable; tras agotarlo, `dead_lettered`.
- **Esperas humanas:** el estado `awaiting_approval` persiste sin consumir worker; el gate tiene vencimiento.
- **MVP:** cola en PostgreSQL (ADR-008).
- **Criterios de entrada para evaluar Temporal u otro motor (Etapa 3):** varios workflows validados con docentes que requieran (a) esperas humanas de días, (b) temporizadores durables (recordatorios, revisiones mensuales), o (c) compensaciones de varios pasos; además, la visibilidad del historial de ejecución se vuelve necesidad operativa. La migración sustituye la implementación de `AgentRuntime`/`TaskStore` sin cambiar dominio ni contratos.

## 6. Context engineering y ensamblaje de contexto

La memoria conversacional **no** depende del contexto del modelo: eventos, decisiones, revisiones, evidencias y versiones se guardan en BD (ADR-018) y el contexto se reconstruye en cada llamada. Diagrama: [diagrams/seq-context-assembly.md](diagrams/seq-context-assembly.md).

**Pipeline (CMP-AIO-CTX), en orden:**

| # | Etapa | Qué hace | Requisito |
|---|---|---|---|
| 1 | Resolver propósito y actor | `purpose` (p. ej. `draft_section`), docente, tenant, grupo, plan | FR-IAM-02 |
| 2 | Autorizar | PDP decide qué fuentes puede usar este propósito | FR-AIO-02 |
| 3 | Recuperar candidatos | Reglas y aprendizajes de la versión curricular; secciones **aprobadas** y la sección objetivo; hechos `confirmed` del docente y del grupo; recursos disponibles | FR-MEM-05 |
| 4 | Filtrar vigencia y estado | Excluye expirados, `candidate`, `rejected`, `retracted`, fuera de audiencia, excluidos por el docente | FR-PLN-13, FR-MEM-06 |
| 5 | Ordenar por relevancia y precedencia | Ranking híbrido (§7) dentro de cada nivel de verdad (BR-01) | BR-01 |
| 6 | Minimizar | Campos permitidos por propósito; sin identidad; `student_ref` nunca se envía; agregados de grupo | FR-STU-02 |
| 7 | Ajustar a presupuesto | Recorta por prioridad: reglas y secciones aprobadas antes que preferencias; nunca recorta restricciones de congelamiento | FR-AIO-06 |
| 8 | Etiquetar procedencia | Cada ítem lleva fuente, versión y razón («por qué recordé esto») | FR-MEM-05 |
| 9 | DLP y egress | §9.3 | FR-AIO-03 |
| 10 | Persistir manifiesto | `ContextManifest` con referencias y hashes | FR-AIO-02 |

**Estructura del prompt:** instrucciones del sistema (fijas y versionadas) → restricciones del docente (secciones congeladas, alcance) → contexto con procedencia → **contenido no confiable delimitado** (documentos importados, salidas de herramientas) marcado como datos → tarea. El esquema «Seis R» (Rol, Resultado, Receptor, Restricciones, Recursos, Revisión; S13) y los cinco componentes de la guía MEP (Tarea, Contexto, Destinatario, Detalle, Propósito; S15) se compilan en esta estructura y el docente puede ver «qué se pidió» (FR-AIO-08).

## 7. Hybrid RAG y recuperación semántica

- **Fuentes indexadas:** currículo público (aprendizajes, orientaciones con cita de sección), secciones del docente (aprobadas y biblioteca), hechos de memoria confirmados. **Nunca** identidad ni texto libre sin DLP.
- **Recuperación híbrida:** (a) filtros estructurados (asignatura, nivel, grupo, unidad, estado); (b) búsqueda léxica (texto completo); (c) búsqueda vectorial (`pgvector`) sobre embeddings sin PII; (d) expansión por el grafo con `GraphAccessService` (profundidad ≤ 3). La combinación de resultados usa fusión por rango; la precedencia BR-01 se aplica después.
- **Autorización antes de similitud:** los filtros de tenant, grupo y audiencia se aplican en la consulta, no tras recuperar.
- **Embeddings:** generados por el gateway con la misma política de egress; con `derived_from` para invalidación (DAT-04). Cambiar de modelo de embeddings implica reindexar, no migrar memoria.
- **Citas:** toda afirmación normativa en la salida debe referir una fuente recuperada; sin fuente → se marca «sin respaldo» (G07).

## 8. Consolidación de memoria

- Fuentes: `DecisionEvent`, reflexiones (`record_reflection`) y turnos con intención explícita del docente.
- Salida: **solo** `MemoryFact` en estado `candidate` con condición `inferencia_por_confirmar` y evidencia enlazada (FR-MEM-03, INV-04).
- Deduplicación: si ya existe un hecho `confirmed` vigente con el mismo `predicate_key`, se propone una actualización (`superseded` al confirmar) en lugar de un duplicado (INV-11).
- Confirmación: el docente acepta, edita o rechaza; se registra `confirmed_by` y la evidencia (INV-03). Una decisión de un plan no se generaliza sin esta confirmación (FR-MEM-09).
- Caducidad: al cerrar el periodo, los hechos del grupo pasan a revisión (FR-MEM-10).

## 9. AI Gateway: routing, DLP, egress, fallback y degradación

### 9.1 Registro de capacidades
Por cada modelo/proveedor (S22): capacidades (contexto, herramientas, salida estructurada, streaming), condiciones de privacidad (uso para entrenamiento, retención, residencia), nivel de proveedor (§9.3), latencia y costo observados, calidad en español medida en 10 §6. Los nombres comerciales cambian; el registro se revalida antes de producción.

### 9.2 Routing por tarea
| Tarea | Política |
|---|---|
| Búsqueda/explicación de norma MEP | Recuperación con cita + validador determinista; modelo eficiente para redactar la explicación |
| Coautoría compleja | Modelo con mejor resultado en las pruebas G01–G10 para respetar restricciones |
| Materiales sencillos | Modelo eficiente si las pruebas no muestran diferencia de calidad |
| Datos de grupo | Solo proveedores con nivel permitido para la clase de dato |
| Validación documental determinista | Sin LLM |

La tabla de selección registra por tarea: resultado en pruebas pedagógicas, costo por plan, latencia p95, tasa de error y tasa de manipulación de aprobado (S22). **Ningún** modelo se elige por reputación sin esas mediciones.

### 9.3 Clases de datos y matriz de egress (provisional, pendiente de validación legal)

| Clase | Contenido | Ejemplo |
|---|---|---|
| C0 | Público | Aprendizajes y reglas MEP |
| C1 | Texto del docente sin datos de estudiantes | Borrador de estrategia |
| C2 | Contexto agregado de grupo, no identificante | «26 estudiantes; prefieren juegos de asociación» |
| C3 | Datos pedagógicos individuales seudonimizados | (deshabilitado en MVP, FR-STU-03) |
| C4 | Identidad directa | Nombre, identificación (solo en la bóveda) |

| Nivel de proveedor | Definición | C0 | C1 | C2 | C3 | C4 |
|---|---|---|---|---|---|---|
| T0 | Ejecución local o controlada por la plataforma | ✓ | ✓ | ✓ | Solo con aprobación legal | ✗ |
| T1 | Proveedor con contrato y DPA, sin entrenamiento con datos del cliente, residencia aceptada por el tenant | ✓ | ✓ | ✓ | Solo con aprobación legal | ✗ |
| T2 | Proveedor vía BYOK del usuario sin DPA de la plataforma | ✓ | ✓ | ✗ | ✗ | ✗ |

C4 **nunca** sale. Las celdas marcadas son **propuestas** hasta la validación legal (SPR-09); el tenant puede restringirlas más, nunca ampliarlas.

### 9.4 DLP
Antes del envío: (1) clasificar cada ítem por su origen (la clase viaja con el dato); (2) detectar en texto libre patrones identificantes (nombres, documentos de identidad, teléfonos, correos, direcciones) con detectores de patrón y, para nombres, con la lista del roster del grupo descifrada en memoria efímera dentro del gateway; (3) redactar o bloquear; (4) si la clase resultante no está permitida para el nivel del proveedor → `egress-blocked`. El `ModelCall` registra clases enviadas, decisión de egress, proveedor, propósito y permiso, **sin contenido**. La salida del modelo pasa por la misma detección antes de persistirse (FR-AIO-07).

### 9.5 Fallback, circuit breakers, timeouts y degradación
- **Timeout budget:** cada tarea tiene un plazo total; cada llamada recibe el tiempo restante menos un margen para validar y persistir. Los valores son configurables y se calibran en el piloto.
- **Circuit breaker por proveedor/modelo:** se abre tras una racha de fallos o timeouts, pasa a semiabierto tras un intervalo y se cierra si las sondas tienen éxito (umbrales configurables, sin valor fijado en este baseline).
- **Fallback:** al siguiente modelo de la política de la tarea **con nivel de proveedor igual o superior** en protección para las clases de dato del contexto; si no hay, no se envía (fail-closed).
- **Degradación:**

| Nivel | Condición | Comportamiento |
|---|---|---|
| L0 | Normal | Todas las funciones |
| L1 | Proveedor principal caído | Fallback permitido; la UI informa el modelo usado |
| L2 | Sin proveedor permitido | Editor, validadores, diff, versiones, aprobación y export siguen operativos; generación no disponible |
| L3 | Presupuesto agotado | Igual que L2 para ese tenant/usuario hasta el siguiente periodo |

## 10. Herramientas y MCP

- **Tool Registry** (CMP-AGX-TOOLS): cada herramienta tiene contrato en [contracts/mcp-tools/](contracts/mcp-tools/) con esquemas, scopes, efectos laterales, clase de dato máxima y si requiere aprobación (05 §13).
- **Invocación:** el supervisor pide la herramienta → el registry verifica allowlist del agente, scopes del token del docente y esquema de entrada → ejecuta con la identidad del docente → valida la salida → registra `ToolInvocation` (sin argumentos sensibles en claro).
- **Herramientas del diseño:** `curriculum.search_outcomes`, `plan.read_sections`, `plan.propose_patch`, `memory.search_facts`, `memory.propose_fact`. Ninguna aprueba, confirma, lee la bóveda ni ejecuta consultas libres.
- **Servidores MCP externos** (Etapa 3+): solo en allowlist del tenant; su salida es contenido no confiable; descripciones de herramientas externas no se incorporan a las instrucciones del sistema sin revisión (*tool poisoning*).

## 11. Gates de aprobación humana

| Acción | Nivel (S21) | Quién aprueba |
|---|---|---|
| Preparar borradores, buscar fuentes, proponer actividades | Automático | — (siempre como propuesta) |
| Aceptar un patch o aprobar una sección | Teacher-in-the-Loop | Docente propietario |
| Sobrescribir documentos aprobados (requiere `reopen`), compartir contenidos, programar comunicaciones | Autorización explícita | Docente propietario |
| Exportar registros estudiantiles, revelar identidades, cambiar permisos, eliminar datos | Privilegio especial | Rol autorizado + propósito + auditoría |

Un gate es un `ApprovalGate` con acción, recurso, solicitante y vencimiento; la resolución es humana y se audita. Si la autorización del solicitante cambia antes de resolverse, el gate se invalida (08 R-07).

## 12. Presupuestos de tokens y costo

- Presupuestos por **tarea** (máximo por ejecución), **usuario** (diario/mensual) y **tenant** (mensual), configurables por plan comercial (OD-08).
- Reserva antes de llamar (estimación de tokens de entrada + máximo de salida), ajuste tras la respuesta; si no alcanza → `429 budget-exceeded` y nivel L3.
- Métricas por tenant y tarea alimentan NFR-COST-01 y el modelo de costo de 11 §11.

## 13. Ejecución aislada (Etapa 4)

Solo bajo demanda para código, edición masiva de documentos o navegación (S21, ADR-011): entorno efímero con TTL, cuotas de CPU y memoria, sistema de archivos efímero, red en allowlist (SPR-05), sin secretos de proveedor ni datos de estudiantes; los artefactos resultantes vuelven como propuestas al almacén versionado y el entorno se destruye. No hay sandbox en el MVP.

## 14. Evaluación de IA
Métricas, conjuntos de prueba y gates: [10 §6–7](10-Test-Strategy.md). Ninguna evaluación hecha por un LLM sustituye la validación humana (FR-EVL-01).

## 15. Decisiones pendientes
OD-03 (niveles de proveedor permitidos y residencia), OD-05 (C3), OD-09 (presupuestos), OD-10 (proveedores y modelos iniciales).

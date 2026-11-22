# 13 — WBS orientado a agentes y fases de desarrollo en paralelo

**Versión:** 0.1-draft · **Estado:** Draft (propuesta, no aprobada) · **Fecha:** 2026-11-22
**Dependencias:** [04 §5–6](04-Software-Architecture.md), [10 §9](10-Test-Strategy.md), [11](11-Roadmap-MVP.md), [contracts/](contracts/README.md), [RTM](traceability/requirements-matrix.csv)
**Decisiones pendientes:** OD-10 (stack y equipo: define las rutas físicas de §3), OD-11 (piloto), OD-15 (aceptación de ADR)

Este documento descompone la construcción del sistema en **paquetes de trabajo (WP) ejecutables por agentes de código** bajo supervisión humana, organizados en fases con carriles paralelos. Desarrolla las épicas E0–E11 de [11 §3](11-Roadmap-MVP.md); no añade alcance.

## 1. Principios de diseño del WBS

1. **Un WP = una frontera de propiedad.** Cada WP es dueño exclusivo de un conjunto de módulos y archivos (§3). Dos agentes nunca escriben los mismos archivos al mismo tiempo; esa es la condición que permite el paralelismo.
2. **Contratos primero.** OpenAPI, AsyncAPI, JSON Schema, herramientas MCP e interfaces de [contracts/](contracts/README.md) se congelan en la Fase 0. Los WP paralelos trabajan contra esos contratos (y contra un mock server), no contra la implementación de otro WP.
3. **La definición de hecho son casos de prueba.** Cada WP cierra cuando pasan los `TC-*` que tiene asignados ([10 §9](10-Test-Strategy.md)). Un agente no puede desactivar, debilitar ni saltarse un test para cerrar su WP.
4. **Lo humano no se delega.** La validación curricular, la evaluación pedagógica, la revisión legal, el pentest externo y la aceptación de ADR son gates humanos. Los agentes preparan materiales y evidencia; no aprueban.
5. **El núcleo pedagógico no depende de la IA.** El editor, el versionado y la aprobación se construyen y prueban sin modelo (Fase 2) antes de conectar la IA (Fase 3), igual que en [11 §5](11-Roadmap-MVP.md).
6. **Sin datos reales.** Todos los agentes trabajan con fixtures sintéticos; ningún agente recibe PII de menores ni credenciales de producción (NFR-PRV-01, SPR-03).
7. **Sin estimaciones inventadas.** El WBS fija alcance, orden y dependencias. El esfuerzo y la duración se estiman al cerrar la Etapa 0, cuando estén definidos el equipo y el stack (OD-10).

## 2. Roles

### 2.1 Agentes

| Rol | Responsabilidad | Escribe en | No puede |
|---|---|---|---|
| **AG-INT Integrador** | Planifica la ola, asigna WP, revisa PR, resuelve conflictos de integración, mantiene el tablero | Configuración de CI y ramas de integración | Cambiar contratos sin el protocolo de §6.2; cerrar gates humanos |
| **AG-CON Contratos** | Mantiene `contracts/`, genera tipos y mock server, gestiona solicitudes de cambio de contrato | `contracts/`, paquete de tipos generados | Implementar lógica de dominio |
| **AG-PLT Plataforma** | IaC, CI/CD, kernel (outbox, idempotencia, cola), observabilidad | `infra/`, módulo `platform` | Tocar módulos de contextos |
| **AG-IAM Identidad** | Tenants, autenticación, PDP, RLS, auditoría | Módulo `iam` (sin `vault`) | Leer o escribir el esquema `vault` |
| **AG-VLT Bóveda** | VaultService, KeyService, roster | Submódulo `iam/vault` | Exponer nombres fuera del servidor de presentación |
| **AG-CUR Currículo** | Catálogo de fuentes, reglas, validadores curriculares, carga de reglas en borrador | Módulo `curriculum` | Marcar reglas como `expert_validated` |
| **AG-PLN Planeamiento** | Agregado del plan, patches, aprobación, impacto, anexos, validador pedagógico | Módulo `planning` | Llamar a AIO o AGX (04 §5.2) |
| **AG-DOC Documentos** | Versiones inmutables, renderizador, export | Módulo `documents` | Usar el LLM en el render |
| **AG-MEM Memoria** | Eventos de decisión, conversación, hechos, grupos, grafo y `GraphAccessService` | Módulo `memory` | Confirmar hechos en nombre del docente |
| **AG-AIO Orquestación de IA** | Gateway, adaptadores, router, DLP, egress, presupuestos, ensamblaje de contexto | Módulo `ai` | Dar al LLM acceso a almacenes |
| **AG-AGX Agentes** | Supervisor, tareas, gates, Tool Registry, MCP | Módulo `agents` | Crear herramientas que aprueben o confirmen |
| **AG-WEB Frontend** | Editor, diff, aprobación, memoria, accesibilidad | `apps/web` | Lógica de autorización en el cliente |
| **AG-QA Calidad y seguridad** | Harness de pruebas, pruebas de concurrencia, suites adversariales y de aislamiento, carga | `tests/` (suites transversales) | Modificar código de producción para que pase una prueba |
| **AG-EVL Evaluación** | Harness de G01–G10, métricas de 10 §6, materiales para el panel humano | `evals/` | Emitir el veredicto pedagógico |

Un mismo modelo o herramienta puede ejecutar varios roles, pero **una sesión de agente trabaja en un solo WP a la vez** y solo dentro de los archivos de ese WP.

### 2.2 Humanos

| Rol | Gates que cierra |
|---|---|
| **H-PO Propietario del producto** | Alcance de cada ola, aceptación de ADR (OD-15), gate MVP |
| **H-TL Líder técnico** | Revisión de contratos congelados, revisión de PR críticos (INV-01, RLS, bóveda, DLP) |
| **H-MEP Especialistas curriculares** | Validación de reglas y plantillas por asignatura (FR-CUR-03); escenarios G01–G10 |
| **H-DOC Panel docente** | Evaluación pedagógica ciega (FR-EVL-01); demos de fase |
| **H-LEG Asesoría legal** | DPIA, textos de autoría y export, matriz de egress (SPR-09, BR-10, OD-16) |
| **H-SEC Seguridad** | Pentest externo, ensayo de incidentes, revisión ASVS (NFR-SEC-02, SPR-06) |

## 3. Mapa de propiedad de módulos

Las rutas son **lógicas**; la estructura física concreta se fija con el stack (ADR-013, OD-10). La regla es invariable: cada ruta tiene un solo agente dueño por ola.

| Ruta lógica | Contexto | Dueño | Esquema BD propio |
|---|---|---|---|
| `contracts/` | — | AG-CON | — |
| `infra/`, `.ci/` | Plataforma | AG-PLT | — |
| `api/modules/platform` | Kernel | AG-PLT | `plt` |
| `api/modules/iam` | BC-IAM | AG-IAM | `iam` |
| `api/modules/iam/vault` | BC-IAM | AG-VLT | `vault` |
| `api/modules/curriculum` | BC-CUR | AG-CUR | `cur` |
| `api/modules/planning` | BC-PLN | AG-PLN | `pln` |
| `api/modules/documents` | BC-DOC | AG-DOC | `doc` |
| `api/modules/memory` | BC-MEM | AG-MEM | `mem`, `kg` |
| `api/modules/ai` | BC-AIO | AG-AIO | `aio` |
| `api/modules/agents` | BC-AGX | AG-AGX | `agx` |
| `apps/web` | Frontend | AG-WEB | — |
| `tests/` (transversales) | QA | AG-QA | — |
| `evals/` | Evaluación | AG-EVL | — |

**Migraciones de BD:** cada contexto mantiene sus migraciones en su propio directorio, con prefijo de esquema y marca de tiempo; nunca modifica tablas de otro esquema (04 §9). Las funciones y triggers que hacen cumplir invariantes los escribe el dueño del esquema.

## 4. Fases y carriles paralelos

Diagrama de dependencias entre paquetes: [diagrams/wbs-dependencies.md](diagrams/wbs-dependencies.md).

| Fase | Objetivo | Carriles paralelos | Gate de salida |
|---|---|---|---|
| **F0 Preparación y contratos** | Etapa 0, esqueleto del repositorio, contratos congelados, harness de pruebas | Humano (Etapa 0) ∥ Plataforma ∥ Contratos ∥ QA ∥ Evaluación | G-F0 (§7) |
| **F1 Fundaciones** | Infraestructura, identidad, RLS, bóveda, kernel, currículo base | Plataforma ∥ Identidad ∥ Bóveda ∥ Currículo ∥ QA ∥ Frontend (contra mocks) | G-F1 |
| **F2 Núcleo pedagógico sin IA** | Editor por secciones, aprobación, impacto, anexos, export, memoria mínima | Planeamiento ∥ Documentos ∥ Memoria ∥ Validadores ∥ Frontend ∥ QA | G-F2 |
| **F3 IA y contexto** | Gateway, DLP, presupuestos, grafo, ensamblaje de contexto, borradores supervisados | Gateway ∥ DLP/egress ∥ Grafo ∥ Prompts y evals ∥ Frontend ∥ QA | G-F3 |
| **F4 Integración y piloto** | E2E G01–G10, endurecimiento, carga/DR, evaluación humana, legal | QA/seguridad ∥ Evaluación ∥ Operación ∥ Humanos (legal, panel, pentest) | **G-MVP** = gates de [11 §9](11-Roadmap-MVP.md) |
| **O2 Ola Etapa 2** | Memoria avanzada y colaboración | Memoria ∥ Planeamiento ∥ Identidad ∥ Plataforma ∥ IA | G-O2 |
| **O3 Ola Etapa 3** | Agentes, workflows durables, MCP | Agentes ∥ Contratos (MCP) ∥ QA | G-O3 |
| **O4 Ola Etapa 4** | Ejecución aislada | Agentes ∥ Plataforma ∥ Seguridad | G-O4 |

Las fases F1–F3 se solapan por carril: un carril empieza en cuanto sus dependencias de §5 están cerradas, sin esperar al resto de la fase. Los gates de fase sincronizan solo lo que exige integración (§7).

## 5. WBS — paquetes de trabajo

Columnas: **Depende de** = WP que deben estar cerrados (o contrato congelado) antes de empezar · **Hecho cuando** = `TC-*` de [10 §9](10-Test-Strategy.md) que deben pasar · **Gate humano** = revisión que no puede hacer un agente.

### 5.1 F0 — Preparación y contratos

| WP | Paquete | Épica | Agente | Depende de | Entregables | Hecho cuando | Gate humano |
|---|---|---|---|---|---|---|---|
| WP-00 | Etapa 0: entrevistas, muestras autorizadas, asesoría legal, benchmark | E8 | Humanos (agentes sintetizan) | — | Requisitos refinados; OD-01..03, OD-10, OD-11, OD-15 resueltas o acotadas | Registro de decisiones en 12 actualizado | H-PO, H-LEG |
| WP-01 | Esqueleto del repositorio y reglas de dependencias entre módulos | E0 | AG-PLT | OD-10 (stack) | Estructura de §3; verificador de dependencias con la matriz de 04 §5.2 | TC-NFR-MNT-01 | H-TL |
| WP-02 | Congelamiento de contratos v1, tipos generados y mock server | E0 | AG-CON | WP-01 | `contracts/` validado con linters estándar; tipos; mock server de OpenAPI | TC-FR-API-01, TC-FR-API-04, TC-FR-API-05 | H-TL revisa y congela |
| WP-03 | Harness de pruebas: PostgreSQL real en contenedor, barreras de concurrencia, fixtures sintéticos, escáneres de PII y secretos | E0 | AG-QA | WP-01 | `tests/` base; fixtures sin PII; escáneres en CI | TC-NFR-PRV-01, TC-SPR-03 (escáneres activos) | — |
| WP-04 | Escenarios G01–G10 como especificaciones ejecutables y rúbrica del panel | E8 | AG-EVL | WP-02 | `evals/` con escenarios, datos sintéticos y validadores deterministas | Escenarios ejecutables (fallan hasta F3) | H-MEP valida los escenarios |

### 5.2 F1 — Fundaciones

| WP | Paquete | Épica | Agente | Depende de | Entregables | Hecho cuando | Gate humano |
|---|---|---|---|---|---|---|---|
| WP-10 | IaC, entornos `dev`/`staging`, pipeline CI/CD | E0 | AG-PLT | WP-01 | Infra declarativa; TLS y cifrado en reposo; CI con SCA, SAST, SBOM | TC-SPR-08, TC-NFR-SEC-01 | H-TL |
| WP-11 | Autenticación OIDC, tenants, usuarios y membresías | E0 | AG-IAM | WP-02 | Integración con IdP de prueba; `iam.*` | TC-FR-IAM-01, TC-FR-IAM-03, TC-EIR-02 | — |
| WP-12 | PDP (RBAC+ABAC+Grant base), RLS `FORCE`, roles de BD | E0 | AG-IAM | WP-11 | Políticas RLS; PDP; prueba que enumera tablas | TC-FR-IAM-02, TC-SPR-01, TC-INV-05, TC-DAT-01 | H-TL revisa RLS |
| WP-13 | Bóveda de identidad, KeyService, roster | E7 | AG-VLT | WP-11 | Esquema `vault`; AEAD; endpoints `/groups/{id}/roster` | TC-FR-STU-01, TC-FR-STU-03, TC-SPR-02, TC-INV-06 | H-TL + H-SEC |
| WP-14 | Audit log append-only | E0 | AG-IAM | WP-12 | `iam.audit_log` con hash encadenado | TC-FR-IAM-05 | — |
| WP-15 | Kernel: outbox, `processed_event`, idempotencia, cola con lease y fencing | E0 | AG-PLT | WP-02, WP-03 | Módulo `platform`; rate limiting y cuotas en la capa API | TC-FR-API-03, TC-FR-API-07, pruebas R-05 y R-09 de 08 | — |
| WP-16 | Observabilidad OpenTelemetry sin PII | E0 | AG-PLT | WP-10 | Instrumentación y redacción en el Collector | TC-NFR-OBS-01 | — |
| WP-17 | Catálogo de fuentes, esquema de reglas y motor de validación | E1 | AG-CUR | WP-02 | `cur.*`; validadores deterministas registrados | TC-FR-CUR-01, TC-FR-CUR-02, TC-INV-12, TC-BR-02 | — |
| WP-18 | Carga de reglas y plantillas de las 4 asignaturas de I y II ciclos | E1 | AG-CUR (borrador) | WP-17, WP-00 | Reglas en estado `unvalidated`, con fuente y sección | TC-FR-CUR-04; TC-FR-CUR-03 con `validation_incomplete` | **H-MEP** valida y marca `expert_validated` |
| WP-19 | Shell de la web: navegación, autenticación, accesibilidad base | E0 | AG-WEB | WP-02 | `apps/web` contra mock server; cadenas en es-CR externalizadas | TC-NFR-I18N-01; auditoría a11y automática sin errores críticos | — |

Paralelismo F1: tras WP-11, **WP-12, WP-13** corren en paralelo; **WP-10, WP-15, WP-17, WP-19** corren en paralelo desde F0; WP-14 sigue a WP-12; WP-18 sigue a WP-17.

### 5.3 F2 — Núcleo pedagógico sin IA

| WP | Paquete | Épica | Agente | Depende de | Entregables | Hecho cuando | Gate humano |
|---|---|---|---|---|---|---|---|
| WP-20 | Agregado `LessonPlan`/`PlanSection`, versiones inmutables, reversión | E2 | AG-PLN + AG-DOC (`artifact_version`) | WP-12, WP-15 | `pln.*`, `doc.artifact_version` | TC-FR-PLN-01, TC-FR-PLN-09 | — |
| WP-21 | Patches, diff, aprobación, reapertura con CAS y triggers de INV-01 | E2 | AG-PLN | WP-20 | Servicios de patch y aprobación; ledger de autoría | TC-FR-PLN-03, TC-FR-PLN-04, TC-FR-PLN-05, TC-INV-01, TC-INV-02, TC-INV-11, TC-FR-API-02; pruebas R-01..R-04 | **H-TL** revisa INV-01 |
| WP-22 | Analizador de impacto | E2 | AG-PLN | WP-20 | Enlaces entre secciones y conjunto de impacto | TC-FR-PLN-06, TC-NFR-PERF-03 | — |
| WP-23 | Validador pedagógico: indicadores, anexos, competencias | E3 | AG-PLN (submódulo `validation`) | WP-20, WP-17 | Validadores y numeración de anexos | TC-FR-PLN-07, TC-FR-PLN-08, TC-FR-CUR-05, TC-INV-09, TC-INV-10, TC-BR-05, TC-BR-06 | — |
| WP-24 | Renderizador determinista y saga de export con atestación | E4 | AG-DOC | WP-20, WP-15 | DOCX/PDF/HTML; `ExportJob`; almacenamiento S3-compatible | TC-FR-PLN-11, TC-FR-PLN-15, TC-EIR-03; prueba R-08 | H-LEG revisa texto de atestación (BR-10) |
| WP-25 | Log de decisiones y conversación | E5 | AG-MEM | WP-15 | `mem.decision_event`, `conversation*` | TC-FR-MEM-01, TC-INV-07 | — |
| WP-26 | Grupos, hechos de memoria, confirmación, rectificación, reflexiones | E5 | AG-MEM | WP-12, WP-25 | `mem.*`; endpoints de memoria y reflexión | TC-FR-MEM-02, TC-FR-MEM-04, TC-FR-MEM-09, TC-FR-PLN-12, TC-INV-03, TC-DAT-02, TC-DAT-03 | — |
| WP-27 | Editor web: secciones, diff, aprobación, anexos, memoria | E2/E3/E5 | AG-WEB | WP-19 (mocks); integra con WP-21..26 | Vistas del plan y de memoria | TC-NFR-USA-01; flujo e2e manual sin IA | **H-DOC** demo de fase |

Paralelismo F2: **WP-20** abre el carril de planeamiento; luego **WP-21, WP-22, WP-23, WP-24** corren en paralelo porque tocan submódulos distintos. **WP-25 → WP-26** corre en paralelo con todo el carril de planeamiento. **WP-27** avanza contra mocks desde el inicio y se integra al cerrar cada WP de backend.

### 5.4 F3 — IA y contexto

| WP | Paquete | Épica | Agente | Depende de | Entregables | Hecho cuando | Gate humano |
|---|---|---|---|---|---|---|---|
| WP-30 | AI Gateway, adaptadores (uno real y uno simulado), router, circuit breakers, timeouts, degradación | E6 | AG-AIO | WP-02, WP-15 | Módulo `ai` | TC-FR-AIO-01, TC-FR-AIO-04, TC-EIR-01, TC-NFR-AVL-01 | — |
| WP-31 | DLP, matriz de egress y Egress Proxy | E6 | AG-AIO (submódulo `dlp`) + AG-PLT (proxy) | WP-30, WP-13 | Clasificación, redacción, bloqueo; proxy con allowlist | TC-FR-AIO-03, TC-SPR-05 | **H-LEG** aprueba la matriz (OD-16); H-SEC |
| WP-32 | Presupuestos de tokens y costo | E6 | AG-AIO (submódulo `budget`) | WP-30 | Reserva y corte; métricas | TC-FR-AIO-06 | — |
| WP-33 | Proyección del grafo y `GraphAccessService` | E5 | AG-MEM | WP-26 | `kg.*`; consumidores idempotentes | TC-INV-08, TC-DAT-04, TC-FR-MEM-05, TC-FR-MEM-06; prueba R-10 | — |
| WP-34 | Ensamblador de contexto y manifiesto; recuperación híbrida | E6 | AG-AIO (submódulo `context`) | WP-30, WP-33, WP-20 | Pipeline de 07 §6; `ContextManifest` | TC-FR-AIO-02, TC-BR-01, TC-FR-PLN-13 | — |
| WP-35 | Supervisor de workflows cortos, tareas de borrador, gates, `plan.propose_patch`, validación de salida | E6 | AG-AGX | WP-34, WP-31, WP-21 | Módulo `agents` (alcance MVP) | TC-FR-PLN-02, TC-FR-AIO-07, TC-FR-AGX-03, TC-SPR-04, TC-FR-IAM-06, TC-FR-MEM-03, TC-INV-04 | **H-TL** revisa gates |
| WP-36 | Prompts versionados por asignatura y ajuste con G01–G10 | E6/E8 | AG-EVL + AG-AIO | WP-35, WP-04 | Prompts y skills por asignatura; informe de métricas de 10 §6 | TC-BR-03, TC-BR-07, TC-BR-08 (evals automáticas) | H-MEP revisa salidas |
| WP-37 | UI de propuestas de IA: alcance, impacto, «por qué recordé esto», degradación | E6 | AG-WEB | WP-27, WP-34, WP-35 | Vistas de propuesta y manifiesto | Flujo G01 e2e en staging | — |

Paralelismo F3: **WP-30** y **WP-33** arrancan en paralelo; tras WP-30, **WP-31 y WP-32** corren en paralelo; **WP-34** junta gateway y grafo; **WP-35 → WP-36** cierran el carril; **WP-37** avanza en paralelo con WP-35.

### 5.5 F4 — Integración y piloto

| WP | Paquete | Épica | Agente | Depende de | Entregables | Hecho cuando | Gate humano |
|---|---|---|---|---|---|---|---|
| WP-40 | Suite e2e G01–G10 sobre staging integrado | E8 | AG-QA + AG-INT | WP-36, WP-37 | Ejecución completa en CI | TC-FR-PLN-04, TC-FR-CUR-04, TC-FR-MEM-07, TC-FR-AGX-03 (e2e) | — |
| WP-41 | Endurecimiento de seguridad: suites adversariales, aislamiento, evidencia ASVS L2 | E0 | AG-QA | WP-35 | Corpus adversarial; checklist con evidencia | TC-NFR-SEC-03, TC-FR-MEM-06, TC-FR-STU-02 | **H-SEC** pentest externo (TC-NFR-SEC-02) |
| WP-42 | Carga, chaos y ensayo de DR | E0 | AG-QA + AG-PLT | WP-40 | Informes de carga y restauración | TC-NFR-PERF-01, TC-NFR-SCL-01, TC-NFR-REL-01, TC-SPR-07 | H-SEC ensayo de incidentes (TC-SPR-06) |
| WP-43 | Evaluación pedagógica humana | E8 | AG-EVL prepara materiales | WP-40 | Paquetes ciegos de evaluación; registro de resultados | TC-FR-EVL-01 | **H-DOC + H-MEP** evalúan |
| WP-44 | Cierre legal: DPIA, textos de autoría y export | E8 | Humanos | WP-00, WP-24, WP-31 | DPIA aprobada; textos revisados | TC-SPR-09, TC-BR-10 | **H-LEG** |
| WP-45 | Operación del piloto: SLO, informe de costo por plan | E8 | AG-PLT | WP-16, WP-32 | Dashboards; informe de costo | TC-NFR-COST-01, TC-NFR-REL-02, TC-NFR-PERF-02 | H-PO |

Paralelismo F4: **WP-41, WP-42, WP-43, WP-44, WP-45** corren en paralelo una vez que WP-40 confirma la integración (WP-41 y WP-44 pueden empezar antes).

### 5.6 Olas posteriores al MVP

| WP | Paquete | Ola | Agente | Depende de | Hecho cuando |
|---|---|---|---|---|---|
| WP-50 | Consolidación de memoria y caducidad por periodo | O2 | AG-MEM | G-MVP | TC-FR-MEM-08, TC-FR-MEM-10 |
| WP-51 | Importación de planes con revisión humana | O2 | AG-PLN | G-MVP | TC-FR-PLN-10 |
| WP-52 | Overlays institucionales, grants y SSO | O2 | AG-CUR + AG-IAM | G-MVP | TC-FR-CUR-06, TC-FR-IAM-04, TC-BR-04, TC-BR-09 |
| WP-53 | Webhooks firmados y contrato de suscripciones | O2 | AG-PLT + AG-CON | G-MVP | TC-FR-API-06 |
| WP-54 | BYOK y compilación visible del contexto («qué se pidió») | O2 | AG-AIO | G-MVP | TC-FR-AIO-05, TC-FR-AIO-08 |
| WP-55 | Portabilidad completa y modo acompañado | O2 | AG-DOC + AG-WEB | G-MVP | TC-NFR-PORT-01, TC-FR-PLN-14 |
| WP-56 | Integraciones LMS/Drive/M365 (si OD-14 lo aprueba) | O2 | AG-PLT | OD-14 | TC-EIR-04 |
| WP-60 | Spike de ejecución durable (Temporal u otro) con los criterios de 07 §5 | O3 | AG-AGX | G-O2 | Informe y ADR-008 actualizado (decisión H-PO) |
| WP-61 | Tool Registry y servidor MCP | O3 | AG-AGX + AG-CON | G-O2 | TC-FR-AGX-02, TC-FR-AGX-05 |
| WP-62 | Workflows durables, agente personal y groupbots | O3 | AG-AGX | WP-60, WP-61 | TC-FR-AGX-01, TC-FR-AGX-04, TC-FR-AGX-07 |
| WP-63 | Workflows programados | O3 | AG-AGX | WP-62 | TC-FR-AGX-08 |
| WP-70 | Spike y construcción del sandbox bajo demanda | O4 | AG-AGX + AG-PLT | G-O3, ADR-011 | TC-FR-AGX-06 |

## 6. Protocolo operativo para agentes

### 6.1 Tarjeta de WP (brief que recibe cada agente)

Cada WP se entrega a un agente como una tarjeta con estos campos, y el agente no trabaja fuera de ella:

| Campo | Contenido |
|---|---|
| Objetivo | Una frase del paquete (§5) |
| Contexto obligatorio | Secciones de 02–09 y ADR citados por los requisitos del WP (vía la [RTM](traceability/requirements-matrix.csv)) |
| Archivos permitidos | Rutas del mapa de §3 asignadas al WP |
| Contratos de solo lectura | Archivos de `contracts/` que consume |
| Hecho cuando | Lista de `TC-*` que deben pasar en CI |
| Prohibiciones | Tocar archivos fuera del WP; cambiar contratos; desactivar o debilitar pruebas; usar datos reales o PII; dar al LLM acceso a almacenes; crear herramientas que aprueben o confirmen |
| Entrega | PR con la evidencia de los TC, el diff de migraciones y una nota de riesgos |

### 6.2 Cambios de contrato durante una fase

1. El agente que necesita el cambio abre una solicitud de cambio de contrato con el motivo y el requisito afectado; **no** edita `contracts/`.
2. AG-CON evalúa si es compatible (05 §9). Un cambio compatible se aplica y se regeneran tipos y mock. Un cambio incompatible requiere la aprobación de H-TL y pausa los WP que consumen ese contrato hasta regenerar.
3. AG-INT re-sincroniza los WP afectados.

### 6.3 Integración y revisión

- **Una rama por WP**, integrada en una rama de fase por AG-INT. La CI completa (10 §2) corre en cada PR.
- **Revisión cruzada:** otro agente revisa cada PR (preferentemente con el rol AG-QA). Los PR que tocan INV-01, RLS, bóveda, DLP o gates requieren además revisión de H-TL.
- **Orden de integración** dentro de una fase: kernel y esquemas → servicios de dominio → API → frontend. Dos WP que comparten una tabla no existen por construcción (§3); si aparece la necesidad, AG-INT los serializa.
- **Bloqueo:** un agente bloqueado más de un intento de corrección por la misma causa registra el bloqueo en el tablero y se detiene; AG-INT reasigna o escala a un humano. No se permiten reintentos indefinidos.

### 6.4 Tablero de trabajo

Cada WP tiene un estado (`pending`, `ready` cuando sus dependencias cerraron, `in_progress`, `in_review`, `blocked`, `done`) y la lista de sus `TC-*` con su resultado. AG-INT solo marca `ready` un WP cuyas dependencias estén `done` y cuyo contrato esté congelado.

## 7. Gates de fase

| Gate | Criterios | Quién lo cierra |
|---|---|---|
| **G-F0** | Contratos v1 congelados; verificador de dependencias activo; harness de pruebas y escáneres en CI; escenarios G01–G10 validados; OD-10 resuelta | H-TL, H-MEP, H-PO |
| **G-F1** | RLS y PDP probados (TC-INV-05, TC-SPR-01); bóveda probada (TC-FR-STU-01); kernel con R-05 y R-09; reglas cargadas con su estado de validación visible | H-TL |
| **G-F2** | INV-01 probado por propiedad y concurrencia; editor, aprobación, anexos y export funcionando **sin IA**; demo con docentes | H-TL, H-DOC |
| **G-F3** | Matriz de egress aprobada; DLP sin fugas en suite sintética; G01–G10 ejecutables con propuestas de IA; degradación sin proveedor probada | H-LEG, H-TL, H-MEP |
| **G-MVP** | Todos los gates de [11 §9](11-Roadmap-MVP.md) | H-PO con H-SEC, H-LEG, H-DOC, H-MEP |
| **G-O2 / G-O3 / G-O4** | TC de los WP de la ola + gate de valor medido en piloto (S26) | H-PO |

## 8. Trazabilidad del WBS

- Cada WP cita sus `TC-*`; cada `TC-X` lleva a su requisito `X` y, por la RTM, a su necesidad, especificación, componente y ADR.
- Todo requisito `P0 · MVP` está en algún WP de F0–F4; los requisitos de las Etapas 2–4 están en las olas O2–O4.
- Las épicas de [11 §3](11-Roadmap-MVP.md) agrupan los WP así: E0 → WP-01, 02, 03, 10, 11, 12, 14, 15, 16, 19, 41, 42 · E1 → WP-17, 18 · E2 → WP-20, 21, 22, 27 · E3 → WP-23 · E4 → WP-24 · E5 → WP-25, 26, 33 · E6 → WP-30, 31, 32, 34, 35, 36, 37 · E7 → WP-13 · E8 → WP-00, 04, 40, 43, 44, 45 · E9 → WP-50 … 56 · E10 → WP-60 … 63 · E11 → WP-70.

## 9. Decisiones pendientes
OD-10 (stack y equipo: rutas físicas y número de sesiones de agente simultáneas), OD-11 (piloto), OD-15 (ADR), OD-16 (matriz de egress, condiciona G-F3).

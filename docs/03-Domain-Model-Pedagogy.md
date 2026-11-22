# 03 — Modelo de dominio pedagógico

**Versión:** 0.1-draft · **Estado:** Draft (no aprobado) · **Fecha:** 2026-11-22
**Dependencias:** [01-PRD](01-PRD.md), suite S02–S08, S20, S24–S25 · **Alimenta:** [04](04-Software-Architecture.md), [06](06-Data-Architecture.md), [10](10-Test-Strategy.md)
**Decisiones pendientes:** OD-02, OD-07 (modalidad de documentos por centro), OD-12 (discrepancias de numeración de la suite)

Este documento es el **centro conceptual**: la arquitectura y la IA se subordinan a él.

## 1. Lenguaje ubicuo (glosario)

| Término | Definición | Notas |
|---|---|---|
| **Tenant** | Unidad de aislamiento: cuenta individual de docente o institución | Cada fila de dominio lleva `tenant_id` |
| **Teacher (docente)** | Usuario con criterio profesional y autoridad de aprobación | Único actor que aprueba |
| **Group (grupo)** | Sección/curso de estudiantes por periodo lectivo | Unidad de contexto y aislamiento |
| **Student (estudiante)** | Menor representado por `student_ref` opaco; identidad en bóveda | No es usuario |
| **CurriculumVersion** | Conjunto versionado de fuentes MEP y reglas | Inmutable al publicarse |
| **LearningOutcome** | Aprendizaje esperado oficial | Con procedencia |
| **LessonPlan** | Planeamiento estructurado de un grupo/asignatura/periodo | Raíz de agregado |
| **PlanSection** | Unidad editable y aprobable (*bloque* en la suite): inicio, desarrollo, cierre, indicador, anexo, etc. | Tiene `kind`, estado y versión actual |
| **ArtifactVersion** | Versión **inmutable** del contenido de una sección o del plan | Hash SHA-256 |
| **Patch** | Propuesta de cambio con `base_version_id`, diff e impacto | No altera hasta `accept_patch` |
| **Approval** | Aprobación docente de una `ArtifactVersion` concreta | No suplantable |
| **Annex (anexo)** | Material para estudiantes, sección de `kind=anexo` | Numeración por primera mención |
| **Indicator (indicador)** | Acción observable ligada a un aprendizaje y a una actividad | |
| **DecisionEvent** | Evento append-only de decisión/propuesta | Fuente de verdad de procedencia |
| **MemoryFact** | Hecho de memoria con condición, estado, validez y evidencia | Candidate → Confirmed |
| **MemoryEvidence** | Referencia que respalda un hecho (evento, reflexión, observación) | |
| **Context Manifest** | Registro de qué se recuperó y por qué para una llamada al modelo | Sin PII |
| **TITL / HITL** | Teacher-in-the-Loop (coautoría y aprobación) / Human-in-the-Loop (control sobre acciones sensibles) | |
| **Groupbot** | Agente contextual de un único grupo; sin identidad ni credenciales | Etapa 3 |
| **Gateway** | Capa interna agnóstica que media toda llamada a modelos | DLP, egress, routing |

## 2. Fuentes de verdad y procedencia

**Orden de verdad (BR-01):** (1) norma MEP vigente → (2) decisiones confirmadas del docente → (3) observaciones verificadas → (4) recomendación pedagógica → (5) salida de IA. Ante conflicto se prefiere el nivel superior y se **informa** al docente.

**Clases de procedencia (S02)** — cada dato del dominio declara su clase:

| Clase | Ejemplo | Uso permitido |
|---|---|---|
| `mep_official` | Plantilla 2026, orientaciones | Validar estructura/vigencia |
| `teacher_confirmed` | «Conservá el inicio, cambiá el desarrollo» | Bloquear edición del inicio en esa revisión |
| `assistant_inference` | «Quizá el grupo prefiere actividades orales» | Proponer; **no** memorizar como hecho |
| `implementation_evidence` | Observación docente tras aplicar | Actualizar perfil con fecha/origen, **previa confirmación** |
| `reconstructed_case` | Geometrópolis, tren STEAM | Inspirar y diseñar pruebas; no sustituye fuente |
| `tech_proposal` | Temporal, Firecracker, modelo X | ADR/experimento; no requisito pedagógico |

## 3. Ciclo de coautoría y máquinas de estado

### 3.1 Ciclo canónico (S03) → eventos

| # | Paso (S03) | Evento(s) | Control |
|---|---|---|---|
| 1 | Entrar desde el docente (aprendizaje, contenido, tiempo, asignatura, grupo, idea) | `create_block` | Preguntar solo lo indispensable |
| 2 | Fundamentar con fuentes MEP | — | Citas + versión |
| 3 | Idear en colaboración (alternativas si se piden) | `propose_patch` | Prosa completa: roles, consignas, materiales, tiempos, evidencias |
| 4 | Construir por bloques (actividad ↔ aprendizaje ↔ anexo ↔ indicador) | `create_block`/`attach_evidence` | Enlaces entre secciones |
| 5 | Revisión diferencial | `accept_patch`/`reject_patch` | Aprobados congelados (INV-01) |
| 6 | Coherencia descendente | `propose_patch` (impacto) | Aprobación separada por impacto |
| 7 | Aprobación explícita | `approve_block`/`reopen_block` | Versión, autor, fecha |
| 8 | Consolidación/exportación | `request_export` | Validaciones INV-09/10 |
| 9 | Aplicación y reflexión | `record_reflection` | No inventar evidencia (BR-08) |
| 10 | Memoria contextual | (propuesta de hechos) | Docente acepta/edita/rechaza |

### 3.2 Estados del plan (S03) — valores de API

`idea → draft → in_review → partially_approved → approved → exported → implemented → reflected` (suite: *idea, borrador, en_revision, parcialmente_aprobado, aprobado, exportado, implementado, reflexionado*).

- `partially_approved` y `approved` **se derivan** del estado de las secciones (no se fijan a mano); `exported/implemented/reflected` se fijan por eventos explícitos: `request_export` lleva a `exported`; la primera `record_reflection` con fecha de aplicación, a `implemented`; una `record_reflection` que cierra el ciclo, a `reflected`.
- Reabrir una sección aprobada devuelve el plan a `partially_approved` o `in_review` según corresponda.

### 3.3 Estados de la sección (S03 §Máquina de estados)

`draft | proposed | approved | reopened` y la **versión** puede quedar `superseded`.

*Interpretación de este baseline:* la suite lista `superseded` entre los estados del bloque; aquí se aplica a la **`ArtifactVersion`** (una versión reemplazada), y la sección conserva los cuatro restantes. Se registra para confirmación en OD-12.

| Transición | Disparador | Guardas | Efecto |
|---|---|---|---|
| `draft → proposed` | `propose_patch` del asistente o del docente | Base = versión actual | Crea `Patch` pendiente |
| `proposed → draft` | `accept_patch` o `reject_patch`/`withdraw` (sección nunca aprobada) | Actor docente; CAS sobre la versión base | Aceptar crea una versión nueva y la anterior queda `superseded`; rechazar cierra el patch |
| `draft/proposed → approved` | `approve_block` | Actor docente; `artifact_version_id` = versión actual; CAS por `row_version` | Congela la versión; ledger; los patches pendientes pasan a `stale` |
| `approved → reopened` | `reopen_block` explícito | Actor docente; motivo | Permite parches |
| `reopened → proposed` | `propose_patch` | Base = versión actual | Crea `Patch` pendiente |
| `proposed → reopened` | `accept_patch` o `reject_patch` (sección reabierta) | Actor docente; CAS | Igual que en `proposed → draft` |
| `reopened → approved` | `approve_block` | Idem aprobación | Nueva aprobación sobre la versión actual; la `Approval` anterior queda `superseded` |
| `approved → (patch)` | **Prohibido** | — | `409 section-approved` |

Diagrama: [state-plan-section](diagrams/state-plan-section.md), [state-plan](diagrams/state-plan.md).

### 3.4 Ejemplo normativo (S03)
Instrucción: «Me gusta el juego de inicio, dejalo igual. El desarrollo es muy escrito; quiero una dinámica cooperativa. El cierre queda intacto».
**Correcto:** resumen de bloques congelados (inicio, cierre), versión original del desarrollo, nueva propuesta con sustento, impactos en anexos/indicadores y controles para aprobar. **Incorrecto:** reescribir todo el plan o cambiar el cierre.

## 4. Estructura del plan y tipos de sección

`PlanSection.kind` ∈ {`aprendizaje`, `contenido`, `metodologia`, `estrategia`, `actividad`, `pregunta`, `anexo`, `indicador`, `instrumento`, `tiempo`, `fuente`, `competencia`, `reflexion`} (valores de API en inglés: `learning_outcome, content, methodology, strategy, activity, question, annex, indicator, instrument, time, source, competency, reflection`).

- Cada sección tiene identificador estable y **enlaces tipados** (`SectionLink`): `supports`, `evidences`, `references_annex`, `assesses`, `depends_on`.
- Los **campos administrativos, aprendizajes, estrategias de mediación, indicadores, competencias** y apartados adicionales se definen por **plantilla exacta aplicable** (versionada por asignatura/modalidad); no se codifica una forma universal (S05 §Estructura).
- Redacción de estrategia (S07): secuencia y mediación con acciones de estudiantes y docente, **consigna textual**, agrupamiento, materiales, preguntas, posibles respuestas/andamiajes, tiempo, evidencia y vínculo con el aprendizaje. «Realizarán una actividad lúdica» **no** es un paso completo.

## 5. Anexos (material del estudiante)

| Regla | Detalle | ID |
|---|---|---|
| Completitud | Instrucciones autónomas por grado, ejemplos si hacen falta, espacio de respuesta, legibilidad, formato imprimible, imágenes propias/permitidas | FR-PLN-07, INV-09 |
| Título natural | El encabezado visible es «Descubrimos palabras escondidas», no «Anexo 1» | BR-05 |
| Numeración | «Anexo N» pertenece al **planeamiento**; se numera por primera mención; menciones posteriores usan referencia natural | BR-05 |
| Estabilidad | El `annex_id` es estable aunque se reordenen actividades; si la referencia se vuelve inconsistente, se alerta | FR-PLN-07 |
| Separación | Solucionario/respuestas docentes separados del material entregable | FR-PLN-07 |
| Evidencias reales | Mediciones/observaciones reales vs. ejemplos simulados deben distinguirse | BR-08 |

## 6. Indicadores, evaluación y competencias

- **Indicador (S05):** acción observable vinculada con aprendizaje/contenido y condición/medio pertinente; sin inferir diagnósticos.
- **Alineación:** aprendizaje ⇄ indicador ⇄ actividad (INV-10, FR-PLN-08). Un instrumento solo evalúa criterios **trabajados** (S05).
- **Competencias 2026:** ciudadanía responsable y solidaria; para la vida; empleo digno y emprendimiento. Deben manifestarse en actividades de mediación y evaluación, **no** como casillas vacías (BR-06, FR-CUR-05).
- **Evaluación formativa/sumativa:** la IA propone preguntas y rúbricas; **no** decide promoción ni diagnostica (BR-07).
- **DUA/accesibilidad:** alternativas de representación/participación/expresión sin etiquetar ni derivar diagnósticos (S08).

## 7. Modelo de reglas curriculares

`CurriculumRule` (FR-CUR-02): `source_id, source_version, effective_from, education_level, modality, subject, rule_type, severity, validator, human_explanation, exceptions` + `rule_class ∈ {required_by_MEP, recommended_by_pedagogy, teacher_preference, local_institution_policy}`.

**Fuente de entrada 2026 (S05, S15):** portal Dirección de Desarrollo Curricular `https://ddc.mep.go.cr/cursolectivo.html` → circular DVM-AC-CIR-0003-2026, Anexo A (plantillas), orientaciones I y II ciclos, guía IA. *Los enlaces están en [fuentes_con_verificacion_y_limites.csv](../idea/fuentes/fuentes_con_verificacion_y_limites.csv); no se han re-verificado en esta pasada.*

| Área (MVP) | Criterio nuclear a modelar | Revisión automática (determinista) |
|---|---|---|
| Español | Comunicación, escucha, lectura, producción; secuencia del programa | Consignas claras, propósito comunicativo, evidencia de comprensión/producción |
| Matemática | Resolución de problemas: propuesta, trabajo independiente, discusión y clausura; luego movilización/aplicación | No adelantar respuestas/fórmulas; coherencia problema–preguntas–materiales |
| Estudios Sociales y Cívica | Enfoque del programa y metodología del **taller**, con integración coherente de ABP si se solicita | Momentos propios; no confundir taller con exposición |
| Ciencias | Indagación: focalización, exploración, contrastación, aplicación | Preguntas investigables, evidencia, explicaciones, transferencia |

**Reglas de alcance:** no homogeneizar asignaturas; no extrapolar I/II a secundaria y EPJA (FR-CUR-04); alto potencial → flexibilización en el plan **grupal** (BR-03); privados: verificar oferta autorizada (BR-04); preferencias del docente **nunca** se etiquetan como mandato MEP (BR-02).

**Revisión humana previa al lanzamiento:** un especialista por área valida ejemplos y reglas con documentos originales; el agente no certifica su propia exactitud; se registra discrepancias y fecha de revalidación por ciclo lectivo (S05). Mientras falte → `validation_incomplete` (FR-CUR-03).

## 8. Modelo de memoria pedagógica

### 8.1 Cuatro memorias separadas (S06)

| Memoria | Contenido | Propietario | Visibilidad por defecto |
|---|---|---|---|
| Docente | Estilo, metodologías, recursos, criterios de aprobación | Docente | Privada |
| Grupo | N.º de estudiantes, ritmos, intereses, actividades favorables, recursos, observaciones no sensibles | Docente del grupo | Privada del docente y grupo |
| Planeamiento | Aprendizaje, fuente MEP, propuestas, versiones, decisiones | Docente | Privada; compartible por `Grant` |
| Institución | Lineamientos, modelos documentales, acuerdos | Tenant institucional | Del tenant; **no** sobrescribe decisiones docentes |

### 8.2 `MemoryFact`
`condition ∈ {observado, preferencia_confirmada, inferencia_por_confirmar}`; `status ∈ {candidate, confirmed, review_required, rejected, expired, superseded, retracted}`; con `valid_from/valid_to`, `confidence`, `audience`, `expires_at`, evidencia ≥1 para confirmar (INV-03).
Reglas: (1) la IA **propone**, el docente **confirma** (FR-MEM-03); (2) una decisión de un plan **no** se vuelve regla futura sin confirmación aparte (FR-MEM-09); (3) hechos temporales del grupo se revisan al cambiar periodo/docente (FR-MEM-10); (4) rectificación y borrado con invalidación de derivados (FR-MEM-04).

**Ejemplo sintético (S06):** «Grupo 4-A: 26 estudiantes; disfrutan juegos de asociación; a veces requieren instrucciones en dos etapas; aulas con impresora monocromática». No implica diagnóstico ni etiqueta; el docente puede marcar `confirmado`/`desactualizado`; el sistema explica cómo afectó la recomendación y permite excluirlo.

### 8.3 Calidad de memoria (métricas)
Precisión del contexto recuperado, proporción de recuerdos confirmados, tasa de sugerencias rechazadas por contexto incorrecto, fugas entre grupos/organizaciones (**objetivo 0**), capacidad de explicar y borrar un recuerdo.

## 9. Contextualización por grupo

Recuperación sensible al propósito (S06): **solo** currículo y versión, preferencias pertinentes del docente, contexto del grupo, partes aprobadas del plan y recursos disponibles. No se inyectan conversaciones enteras ni expedientes estudiantiles. Detalle del ensamblaje: [07 §6](07-AI-Agentic-Architecture.md).

## 10. Casos recuperados → diseño de pruebas

La suite advierte que los casos A–E (S04) son **antecedentes reconstruidos, no transcripciones ni normativa**. Se usan exclusivamente para modelar *cómo se trabaja* y para derivar pruebas; antes de usarse como *golden tests oficiales* requieren cotejo con originales y permisos.

| Caso (S04) | Regla que prueba | Escenario (S25) | Qué **no** se afirma |
|---|---|---|---|
| A Matemática área/perímetro (Geometrópolis) | Progresión: explorar antes de formalizar; juego no sustituye el enfoque | G03 | Que el juego mejoró aprendizaje |
| B Ciencias STEAM (tren) | Preservar hipótesis/variables aprobadas; no inventar datos; vincular indicadores | G04 | Fotos/observaciones inventadas |
| C Sociales/Cívica (taller + ABP/ABPr) | Metodología activa complementa el programa; no sustituir momentos oficiales | — | Que «rompehielos» sea apartado oficial |
| D Anexos y estaciones (Pasaporte de Misión) | Consignas, vínculo a indicadores, numeración por primera mención | G02 | — |
| E Español (juego de palabras) | Escenario de producto confirmado, no plan aprobado | — | Historial previo específico |

**Estructura de caso de prueba:** origen, grado/área, problema, decisión docente, antes/después, regla pedagógica, evidencia, límite, aprobación, ejemplo de comportamiento incorrecto. **Nunca** usar para entrenamiento externo sin autorización y evaluación de privacidad.

## 11. Invariantes pedagógicos (resumen operable)

| ID | Invariante | Verificación principal |
|---|---|---|
| INV-01 | Sección aprobada inmutable hasta `reopen` | Propiedad + BD + concurrencia |
| INV-02 | Solo un docente humano aprueba | Seguridad + BD |
| INV-03 | `confirmed` requiere confirmación docente y evidencia | BD + integración |
| INV-04 | Inferencia del LLM nunca queda confirmada | Seguridad + eval de agente |
| INV-08 | Sin mezcla de grupos; grafos público/privado separados | Seguridad + propiedad |
| INV-09 | Anexo existe y está completo antes de exportar | Integración |
| INV-10 | Aprendizaje↔indicador ↔ actividad correspondientes | Propiedad |
| INV-11 | Una aprobación activa por versión; un hecho vigente por predicado | Concurrencia |
| INV-12 | Reglas publicadas inmutables | Integración |
| BR-08 | No se inventa evidencia | Eval de agente + inspección |

## 12. Decisiones pendientes
OD-02 (texto de autoría), OD-07 (documentos exigidos por cada centro), OD-12 (numeración/`superseded`), OD-05 (perfiles individuales).

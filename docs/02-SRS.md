# 02 — Software Requirements Specification (SRS)

**Versión:** 0.2-draft · **Estado:** Draft (todos los requisitos `Proposed`) · **Fecha:** 2026-11-22
**Referencias metodológicas:** ISO/IEC/IEEE 29148 (ingeniería de requisitos); ISO/IEC 25010 (modelo de calidad; nomenclatura de la edición 2023, a verificar).
**Dependencias:** [01-PRD](01-PRD.md), [03-Domain-Model-Pedagogy](03-Domain-Model-Pedagogy.md) · **Alimenta:** 04–11, [RTM](traceability/requirements-matrix.csv)
**Decisiones pendientes:** OD-02, OD-03, OD-05, OD-09, OD-10

## 1. Introducción

### 1.1 Propósito y alcance
Especifica los requisitos verificables de la Plataforma Docente (Costa Rica, I y II ciclos, cuatro asignaturas en el MVP). Es una plataforma multi-tenant, centrada en el docente e independiente del proveedor de IA. El sistema **no** reemplaza al docente ni certifica cumplimiento MEP.

### 1.2 Lenguaje normativo y estados
**MUST** = obligación; **SHOULD** = recomendación con excepción justificada; **MAY** = opcional. Todo requisito está en `Proposed`: ninguno ha sido aprobado por el propietario. Los valores con la marca *provisional engineering target* no tienen evidencia y se calibrarán tras la Etapa 0 y el piloto.

### 1.3 Prioridad y etapa
La columna *Priority* combina prioridad y etapa. `P0` = el núcleo o su seguridad debe resolverse **antes de exponerlo a usuarios reales** (S27); `P1` = necesario para el valor completo; `P2` = diferible. Etapas: `MVP` (Etapa 1), `F2`, `F3`, `F4` (Etapas 2–4 de S26).

### 1.4 Fuentes y columnas
*Source* usa los códigos `S<NN>` de [README §4](README.md); `ARCH` = derivado por el arquitecto para este baseline. *Verification Method* sigue 29148: Test (con su nivel), Inspection, Analysis o Demonstration. Cada requisito `X` tiene el caso de prueba `TC-X` (ver [10 §9](10-Test-Strategy.md)) y filas en la [RTM](traceability/requirements-matrix.csv).

**Nomenclatura:** las necesidades de la suite conservan sus IDs (`DOC-01`, `SEC-01`, …). Los requisitos de seguridad y privacidad de este SRS usan el prefijo **`SPR-`** para no confundirse con la necesidad `SEC-01`.

### 1.5 Necesidades de origen (Need IDs) y cobertura

| Need ID | Descripción (S27) | Requisitos que la cubren |
|---|---|---|
| DOC-01 | Docente conserva decisiones, voz, estilo, autoría y aprobación | FR-PLN-02, FR-PLN-04, FR-PLN-05, FR-PLN-09, FR-PLN-10, FR-PLN-11, FR-PLN-15, FR-MEM-01, FR-MEM-03, FR-MEM-09, FR-IAM-02, FR-IAM-04, FR-AIO-08, FR-AGX-03, NFR-PORT-01, BR-01, BR-07, BR-08, BR-09, BR-10, INV-01, INV-02 |
| DOC-02 | Memoria y recuperación de conversaciones/decisiones con procedencia | FR-PLN-02, FR-PLN-12, FR-PLN-13, FR-MEM-01, FR-MEM-02, FR-MEM-03, FR-MEM-04, FR-MEM-05, FR-MEM-07, FR-MEM-08, FR-MEM-09, FR-AIO-02, INV-03, INV-04, INV-07, INV-11, DAT-02, DAT-03, DAT-04 |
| DOC-03 | Modificar solo bloques solicitados, proteger los aprobados | FR-PLN-01, FR-PLN-03, FR-PLN-04, FR-PLN-05, FR-PLN-06, FR-PLN-08, FR-AIO-07, FR-API-02, FR-API-03, NFR-PERF-01, NFR-PERF-03, INV-01, INV-11 |
| MEP-01 | Reglas MEP por año, modalidad y asignatura | FR-CUR-01, FR-CUR-02, FR-CUR-03, FR-CUR-04, FR-CUR-06, FR-PLN-08, BR-01, BR-02, BR-03, BR-04, INV-10, INV-12 |
| MEP-02 | Competencias en mediación y evaluación según 2026 | FR-CUR-05, BR-06 |
| ART-01 | Materiales/anexos completos, naturales, nivel pertinente | FR-PLN-01, FR-PLN-07, FR-PLN-11, NFR-USA-01, BR-05, INV-09, EIR-03 |
| GRP-01 | Grupo y necesidades pedagógicas, sin mezcla de grupos | FR-PLN-12, FR-PLN-13, FR-MEM-05, FR-MEM-06, FR-MEM-10, FR-STU-01, FR-STU-03, FR-AIO-02, FR-AGX-04, NFR-SEC-03, INV-08 |
| INN-01 | IA agnóstica de proveedor, API propia, MCP protegido | FR-STU-02, FR-AIO-01, FR-AIO-03, FR-AIO-04, FR-AIO-05, FR-AIO-06, FR-AGX-02, FR-AGX-05, FR-API-01, FR-API-04, FR-API-05, FR-API-06, NFR-PERF-02, NFR-AVL-01, NFR-REL-02, NFR-SCL-01, NFR-OBS-01, NFR-MNT-01, NFR-PORT-01, NFR-COST-01, SPR-03, EIR-01 |
| SEC-01 | Privacidad de menores, control de tenant y segregación de identidad | FR-MEM-04, FR-MEM-06, FR-IAM-01, FR-IAM-02, FR-IAM-03, FR-IAM-05, FR-IAM-06, FR-STU-01, FR-STU-02, FR-STU-03, FR-AIO-02, FR-AIO-03, FR-AIO-05, FR-AIO-07, FR-API-07, NFR-REL-01, NFR-SEC-01, NFR-SEC-02, NFR-SEC-03, NFR-PRV-01, BR-07, INV-05, INV-06, INV-07, INV-08, SPR-01 … SPR-09, DAT-01, DAT-03 |
| EVAL-01 | Validación humana y métricas pedagógicas | FR-CUR-03, FR-EVL-01, BR-08 |
| AGT-01 | Agente personal y groupbots | FR-STU-02, FR-AGX-02, FR-AGX-03, FR-AGX-04, FR-AGX-05, SPR-04 |
| AGT-02 | Workflows persistentes y aprobaciones | FR-IAM-06, FR-AGX-01, FR-AGX-03, FR-AGX-07, FR-AGX-08, FR-API-03 |
| VM-01 | MicroVM bajo demanda para trabajos complejos | FR-AGX-06, SPR-05 |
| INST-01 | Cuentas institucionales y bibliotecas con permisos | FR-CUR-06, FR-IAM-01, FR-IAM-02, FR-IAM-04, FR-IAM-05, FR-API-06, BR-09, INV-05, EIR-02, EIR-04 |
| PRI-01 | Plantillas y bilingüismo cuando estén autorizados | FR-CUR-06, NFR-I18N-01, BR-04, EIR-04 |
| RND-01 | Herramientas inspiradas en TEC/UCR/Claude/Brisk/etc. | FR-PLN-10, FR-PLN-14, FR-AIO-08, NFR-USA-01 |

## 2. Descripción global

### 2.1 Perspectiva del producto
Monolito modular (ADR-001) con siete contextos delimitados y un kernel de plataforma. Contexto y contenedores: [04 §3–4](04-Software-Architecture.md).

### 2.2 Restricciones críticas
1. Las decisiones docentes aprobadas son **invariantes funcionales** hasta una operación explícitamente autorizada (INV-01).
2. La memoria conserva evidencia, procedencia, temporalidad y estado de aprobación; las inferencias del LLM **no** se convierten en hechos confirmados (INV-04).
3. La IA es una capa de soporte; no sustituye el modelo del dominio pedagógico.
4. Ningún LLM ni agente accede sin restricción a los almacenes persistentes (FR-STU-02, FR-AIO-02).
5. Sin PII de menores en ejemplos, logs ni fixtures (NFR-PRV-01).

### 2.3 Supuestos y dependencias
- Las reglas MEP se extraen de documentos 2026 y requieren validación experta por asignatura antes del lanzamiento (FR-CUR-03).
- Proveedor de nube, IdP, proveedores de IA y equipo se deciden en OD-04 y OD-10.
- La legalidad del tratamiento de datos de menores en Costa Rica **no está validada** (SPR-09, OD-03).

### 2.4 Atributos de calidad (ISO/IEC 25010)

| Característica | Cobertura | Requisitos |
|---|---|---|
| Functional suitability | Coautoría, validación curricular, anexos | FR-PLN-*, FR-CUR-* |
| Performance efficiency | Latencia de API, diff, capacidad | NFR-PERF-*, NFR-SCL-01 |
| Compatibility | Contratos abiertos, adaptadores | FR-API-*, EIR-* |
| Interaction capability | WCAG, modos acompañado/experto, baja conectividad | NFR-USA-01, FR-PLN-14 |
| Reliability | Disponibilidad, RPO/RTO, degradación sin IA | NFR-AVL-01, NFR-REL-* |
| Security | RLS, bóveda, DLP, auditoría | SPR-*, NFR-SEC-*, INV-05, INV-06 |
| Maintainability | Límites de módulos, ADR, contratos | NFR-MNT-01, FR-API-05 |
| Flexibility | Independencia de proveedor, export abierto | FR-AIO-01, NFR-PORT-01 |
| Safety (daño a menores) | Minimización, supervisión humana | BR-07, FR-STU-*, FR-AGX-03 |

## 3. Requisitos funcionales (FR)

Sub-áreas: **CUR** currículo · **PLN** planeamiento y documento · **MEM** memoria · **IAM** identidad y acceso · **STU** estudiantes · **AIO** orquestación de IA · **AGX** agentes · **API** interfaz · **EVL** evaluación.

### 3.1 Currículo (CUR)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-CUR-01** | El sistema MUST mantener un catálogo versionado de fuentes curriculares: documento, sección, URL, fecha de consulta, hash del archivo, vigencia y estado de validación experta. | P0 · MVP | S05, S24 §7 | Un enlace no prueba que una plantilla esté bien aplicada; hace falta trazabilidad por versión. | Cada regla publicada referencia `source_id` + `source_version`; no se puede publicar una regla sin fuente. | Test: integration; Inspection del catálogo | Proposed |
| **FR-CUR-02** | Cada regla MUST incluir `source_id, source_version, effective_from, education_level, modality, subject, rule_type, severity, validator, human_explanation, exceptions` y una clase `required_by_MEP` \| `recommended_by_pedagogy` \| `teacher_preference` \| `local_institution_policy`. | P0 · MVP | S05 §Sistema de reglas | Evita presentar preferencias como mandato oficial (BR-02). | `curriculum-rule.schema.json` rechaza reglas incompletas; la UI muestra la clase de cada hallazgo. | Test: contract + unit | Proposed |
| **FR-CUR-03** | El sistema MUST validar un plan contra la plantilla y las reglas aplicables y devolver hallazgos con cita (fuente + sección). MUST NOT emitir sello de cumplimiento; sin validación experta registrada MUST mostrar «validación incompleta». | P0 · MVP | S05, S24 §Validación | La validez normativa la certifican expertos, no el agente. | Un plan con una regla sin validación experta devuelve `validation_incomplete`; ningún endpoint devuelve «cumple». | Test: integration; Demonstration | Proposed |
| **FR-CUR-04** | El MVP MUST soportar I y II ciclos de Español, Matemática, Estudios Sociales y Educación Cívica, y Ciencias, y MUST rechazar con mensaje explícito los niveles o modalidades sin plantilla cargada (secundaria, EPJA). | P0 · MVP | S24 §2, S26 | No extrapolar I/II ciclos a otros niveles. | Pedir un plan de un nivel sin plantilla devuelve `422 curriculum/unsupported-level`. | Test: e2e | Proposed |
| **FR-CUR-05** | El sistema SHOULD verificar que cada competencia declarada esté vinculada a actividades de mediación concretas y MUST NOT rellenar competencias sin relación didáctica. | P0 · MVP | S15 §Competencias, S24 §3 | Las competencias 2026 no son casillas vacías. | Competencia sin actividad vinculada → hallazgo `warning`; ninguna competencia se inserta sin acción docente. | Test: unit + integration | Proposed |
| **FR-CUR-06** | El sistema MUST soportar reglas institucionales (`local_institution_policy`) con procedencia propia, separadas de las oficiales e incapaces de sobrescribir decisiones docentes aprobadas. | P1 · F2 | S09 J4, S12, S24 §5 | Los centros privados y bilingües tienen plantillas adicionales; no se asume exención del MEP. | Un overlay aparece etiquetado como institucional; aplicarlo no modifica secciones aprobadas. | Test: integration | Proposed |

### 3.2 Planeamiento y documento (PLN)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-PLN-01** | El plan MUST representarse como documento estructurado de secciones tipadas (`PlanSection`) con identificador estable, versionadas y enlazadas (aprendizaje, contenido, metodología, estrategia, actividad, pregunta, anexo, indicador, instrumento, tiempo, fuente, competencia, reflexión). | P0 · MVP | S07 §Modelo | La unidad de trabajo son bloques referenciables, no texto plano. | Cada tipo de sección se crea, lee y versiona vía API; los IDs no cambian al reordenar. | Test: integration | Proposed |
| **FR-PLN-02** | El sistema MUST implementar el flujo Teacher Intent → Context Retrieval → Curriculum Validation → Draft Generation → Teacher Review → Selective Revision → Approval → Versioned Artifact, con un evento auditable por transición. | P0 · MVP | S03 §Ciclo canónico | Es el proceso núcleo del producto. | El escenario e2e G01 recorre todos los pasos y deja un `DecisionEvent` por transición. | Test: e2e | Proposed |
| **FR-PLN-03** | Toda modificación propuesta (docente o asistente) MUST representarse como `Patch` con `base_version_id`, diff y conjunto de impacto; solo cambia contenido tras `accept_patch` explícito del docente. | P0 · MVP | S03, S07 | Revisión diferencial sin reescritura silenciosa. | Un patch no aceptado nunca altera `current_version`; aceptar con base obsoleta devuelve `409 patch-stale`. | Test: integration + concurrency | Proposed |
| **FR-PLN-04** | Una revisión MUST limitarse a las secciones objetivo; las secciones `approved` MUST permanecer byte a byte idénticas y todo patch que las toque MUST rechazarse salvo `reopen` explícito previo. | P0 · MVP | S07 §Pruebas, S25 G01 | Invariante central (INV-01). | Para cualquier secuencia de operaciones sin `reopen`, el hash de toda sección aprobada es constante. | Test: property-based + e2e | Proposed |
| **FR-PLN-05** | `approve_block` y `reopen_block` MUST estar reservados a docentes con permiso, registrar autor, timestamp, versión y alcance, y referirse a una `artifact_version_id` concreta. | P0 · MVP | S03 §7, S07 §Semántica | Aprobación explícita y no suplantable. | Un actor `assistant`/`system` no puede crear `Approval` (rechazo en dominio y BD); aprobar una versión que ya no es la actual devuelve `409`. | Test: integration + security | Proposed |
| **FR-PLN-06** | Ante un cambio, el sistema MUST calcular y mostrar el impacto en secciones dependientes (tiempo, anexos, indicadores, evaluación) como propuestas pendientes con aprobación separada. | P0 · MVP | S03 §6, S07 | Coherencia descendente sin cambios silenciosos. | Cambiar `desarrollo` lista los anexos e indicadores enlazados; ninguno cambia sin su propio `accept_patch`. | Test: integration | Proposed |
| **FR-PLN-07** | Los anexos MUST ser materiales completos desde la perspectiva del estudiante (título natural, consignas, ejercicios, espacio de respuesta), numerados por primera mención y con el solucionario docente separado. | P0 · MVP | S07 §Calidad de anexos, S25 G02 | El anexo debe poder usarse en clase. | El validador rechaza anexos sin consignas o con encabezado visible «Anexo N»; el export no incluye el solucionario en la hoja del estudiante. | Test: integration; Inspection (muestra humana) | Proposed |
| **FR-PLN-08** | Cada indicador MUST vincularse a un aprendizaje esperado y a la actividad donde se observa; el sistema MUST validar la correspondencia aprendizajes↔indicadores antes de `approved`/`exported`. | P0 · MVP | S05 §Indicadores, S25 | Trazabilidad curricular. | Aprendizaje sin indicador o indicador huérfano bloquea `exported` con hallazgo `error`. | Test: unit + property-based | Proposed |
| **FR-PLN-09** | El sistema MUST permitir revertir una sección a una versión previa creando una versión nueva (no destructiva) y registrando el evento. | P0 · MVP | S09 J2, S07 | El docente puede deshacer. | Tras `revert`, el historial conserva todas las versiones y la nueva apunta a `parent_version_id`. | Test: integration | Proposed |
| **FR-PLN-10** | El sistema SHOULD importar un planeamiento existente con revisión humana obligatoria antes de considerar sus secciones `draft` del docente. | P1 · F2 | S16 (Brisk), S18 (EEF/Aila) | La evidencia externa sugiere más utilidad al mejorar planes existentes que al crear desde cero (hipótesis a probar). | Un import crea secciones `draft` con `authorship=import`, nunca `approved`. | Test: integration | Proposed |
| **FR-PLN-11** | El export (DOCX/PDF/impresión) MUST ejecutarse solo a petición, desde versiones identificadas, sin referencias duplicadas ni anexos incompletos, y MUST registrar `request_export` con la atestación docente. | P0 · MVP | S07, S10 §Salidas | Exportar no es entregar oficialmente. | Exportar con anexo incompleto falla con `422`; el documento reproduce exactamente las versiones indicadas (hash). | Test: integration + e2e | Proposed |
| **FR-PLN-12** | El sistema MUST registrar la reflexión de implementación (`record_reflection`) enlazada a plan, grupo, fecha y actividad, sin inventar evidencia ni atribuir causas sin sustento. | P1 · MVP | S09 J3, S03 §9 | Aplicar y aprender sin fabricar desempeño. | La reflexión queda como `MemoryEvidence`; el sistema pregunta si debe tratarse como preferencia y no la confirma por sí mismo. | Test: integration | Proposed |
| **FR-PLN-13** | El sistema MUST usar el contexto confirmado del grupo al generar y MUST permitir excluir un dato de contexto de un plan concreto, mostrando cómo afectó la recomendación. | P0 · MVP | S06 §Ejemplo, S09 J1 | Contextualización por grupo explicable. | El manifiesto de contexto lista los `MemoryFact` usados; excluir uno lo omite en la siguiente generación. | Test: integration; Agent eval | Proposed |
| **FR-PLN-14** | El sistema SHOULD ofrecer un modo acompañado (con explicaciones del porqué) y un modo experto (flujos rápidos), elegidos por el docente. | P2 · F2 | S09 J5 | No imponer el mismo nivel de guía a todos. | La preferencia persiste por usuario; el modo acompañado agrega explicaciones con fuente. | Test: e2e; Demonstration | Proposed |
| **FR-PLN-15** | El sistema MUST registrar un ledger de contribuciones por versión (`teacher` vs `assistant_accepted` vs `import`) y MUST NOT etiquetar un plan como entregado u oficial sin atestación de revisión docente. | P0 · MVP | S24 §1, S25 G10 | La circular 2026 exige diseño y redacción personal; la plataforma es coelaboración. | El export exige atestación explícita; el ledger distingue texto propuesto por IA y aceptado del escrito por el docente. | Test: integration; Inspection (revisión legal) | Proposed |

### 3.3 Memoria pedagógica (MEM)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-MEM-01** | El sistema MUST registrar `DecisionEvent` append-only con `event_id, tenant_id, teacher_id, plan_id, section_id, event_type, prior_version, new_version, decision_source, teacher_confirmation, rationale, timestamp, provenance_ref, pii_classification`, distinguiendo `assistant_proposal` de `teacher_approval`. | P0 · MVP | S20 §Contrato | Fuente de verdad de decisiones y procedencia. | UPDATE/DELETE sobre `decision_event` falla en BD; cada tipo de evento lo emite su operación. | Test: integration; Inspection (permisos BD) | Proposed |
| **FR-MEM-02** | Cada `MemoryFact` MUST tener scope (docente \| grupo \| plan \| institución), condición (`observado` \| `preferencia_confirmada` \| `inferencia_por_confirmar`), estado, confianza, validez temporal, audiencia, caducidad y, para confirmarse, ≥1 `MemoryEvidence`. | P0 · MVP | S06 §Cuatro memorias, S20 | Una memoria no es una lista de todo lo dicho. | No se puede persistir un hecho `confirmed` sin evidencia ni confirmación docente (restricción de BD). | Test: unit + integration | Proposed |
| **FR-MEM-03** | Los hechos originados por el LLM MUST nacer como `candidate` con condición `inferencia_por_confirmar`; solo un docente autorizado MAY confirmarlos. | P0 · MVP | S06 §Gobierno, S02 §Distinción | No convertir inferencias en hechos (INV-04). | Confirmar con actor `assistant`/`system` falla; regresión con salida del LLM que afirma un «hecho». | Test: security; Agent eval | Proposed |
| **FR-MEM-04** | El docente MUST poder ver, editar, rechazar, caducar, rectificar y eliminar un recuerdo; la operación MUST invalidar derivados (embeddings, resúmenes, aristas) en ≤ 24 h (*provisional*). | P0 · MVP | S20 §Política, S06 | Derecho de rectificación y control. | Tras eliminar un hecho, ninguna recuperación lo devuelve y sus derivados quedan `invalidated`. | Test: integration | Proposed |
| **FR-MEM-05** | La recuperación MUST devolver para cada ítem procedencia y razón («por qué recordé esto») y MUST aplicar permisos, vigencia y propósito antes de entregar contenido. | P0 · MVP | S20 §Recuperación, S06 | Explicabilidad y minimización. | La API devuelve `provenance` y `reason` no vacíos; ítems expirados o fuera de audiencia no aparecen. | Test: contract + integration | Proposed |
| **FR-MEM-06** | La recuperación MUST aislarse por tenant, docente y grupo: ninguna consulta MAY devolver datos de otro grupo no autorizado, aunque sea del mismo docente. | P0 · MVP | S06, S25 G06 | Aislamiento de grupos como requisito bloqueante. | Suite adversarial G06: 0 filtraciones entre grupos y tenants. | Test: security + property-based | Proposed |
| **FR-MEM-07** | El sistema MUST persistir la conversación autorizada (turnos, intención, sección afectada, versión) con política de retención; los resúmenes MUST ser derivados revocables que no sustituyen a los eventos. | P0 · MVP | S03 §Modelo de memoria, S02 §Regla | La memoria conversacional no puede depender del contexto del modelo. | Tras cambiar de proveedor y reabrir el plan semanas después, conversación y decisiones se reconstruyen sin el resumen. | Test: integration + e2e | Proposed |
| **FR-MEM-08** | El sistema SHOULD ejecutar una consolidación de memoria que proponga hechos `candidate` a partir de eventos y reflexiones, sin confirmarlos. | P1 · F2 | S20, S06 | Aprender del uso con gobierno. | El job solo escribe `candidate`; la tasa de aceptación se mide. | Test: integration; Agent eval | Proposed |
| **FR-MEM-09** | Una decisión tomada en un plan MUST NOT convertirse en regla para planes futuros sin confirmación explícita y separada del docente. | P0 · MVP | S06 §Gobierno | Memoria puntual ≠ preferencia universal. | Aprobar un bloque no crea `preferencia_confirmada`. | Test: integration | Proposed |
| **FR-MEM-10** | El sistema SHOULD pedir revisión o caducidad de los hechos temporales al cerrar un periodo lectivo o cambiar de docente. | P2 · F2 | S06, S20 | Las observaciones valen por periodo. | Al cerrar el periodo, los hechos del grupo pasan a `review_required`. | Test: integration | Proposed |

### 3.4 Identidad y acceso (IAM) y estudiantes (STU)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-IAM-01** | El sistema MUST soportar tenants individuales e institucionales y `Membership` con roles por tenant. | P0 · MVP | S11, S12 | Dos puertas al mismo núcleo. | Un docente puede tener tenant personal y membresías institucionales sin mezcla de datos. | Test: integration | Proposed |
| **FR-IAM-02** | La autorización MUST combinar RBAC, ABAC (propósito, recurso, grupo, estado) y RLS; un rol institucional MUST NOT dar acceso a artefactos privados del docente sin concesión explícita. | P0 · MVP | S09 J4, S23 §Política institucional | El acceso institucional no legitima ver datos privados. | Un coordinador sin concesión recibe `404/403` al leer un plan privado; pruebas IDOR/BOLA sobre todos los recursos. | Test: security + integration | Proposed |
| **FR-IAM-03** | La autenticación MUST usar OIDC con MFA/passkeys disponibles; MFA MUST ser obligatorio para roles administrativos e institucionales. | P0 · MVP | S23 §Controles mínimos | Control verificable mínimo. | Login de rol admin sin segundo factor → denegado. | Test: security; Inspection | Proposed |
| **FR-IAM-04** | Compartir o transferir artefactos MUST requerir una concesión (`Grant`) con propósito, alcance y vencimiento; transferir datos entre docentes requiere además base legal registrada. | P1 · F2 | S09 J4 | Nadie ve ni modifica en silencio documentos personales. | Compartir sin `Grant` falla; un grant vencido deja de aplicar. | Test: integration | Proposed |
| **FR-IAM-05** | Los accesos privilegiados y sensibles (bóveda, export, permisos, eliminaciones, herramientas de agentes) MUST registrarse en un audit log inmutable sin PII en claro. | P0 · MVP | S23 | Auditoría verificable. | Cada acción listada genera una entrada; el log rechaza UPDATE/DELETE; el escaneo no encuentra PII. | Test: integration; Inspection | Proposed |
| **FR-IAM-06** | La revocación de permisos o membresía MUST surtir efecto en ≤ 60 s (*provisional*), incluidas tareas y sesiones en curso. | P0 · MVP | ARCH (S21 §Límites) | Evitar acceso residual de agentes y sesiones. | Prueba R-07 de 08: una tarea en curso falla en el siguiente chequeo tras revocar. | Test: concurrency | Proposed |
| **FR-STU-01** | La identidad estudiantil MUST guardarse en una bóveda separada, con identificadores opacos aleatorios y cifrado autenticado (AEAD) con claves envolventes en KMS; MUST NOT recuperarse identidad mediante un hash. | P0 · MVP | S23, S06 §Knowledge Graph | Segregación de identidad (INV-06). | Esquema `vault` con rol propio; AAD = `tenant_id‖student_ref‖schema_version`; no existen índices por hash del nombre. | Test: security; Inspection | Proposed |
| **FR-STU-02** | Ningún agente, herramienta MCP ni llamada al LLM MAY acceder a la bóveda; los nombres se resuelven en la capa de presentación del servidor, fuera del contexto del modelo. | P0 · MVP | S23 §Políticas de IA, S22 | Mínimo privilegio. | El catálogo de herramientas no contiene alcances `vault:*`; un ataque de inyección no obtiene nombres. | Test: security; Agent eval | Proposed |
| **FR-STU-03** | El MVP MUST operar a nivel de grupo; los perfiles pedagógicos individuales (seudonimizados) MUST estar deshabilitados por defecto y condicionados a revisión legal y DPIA (OD-05). | P0 · MVP | S26 Etapa 4, S11 | Evitar sobrecolecta. | El flag `student_level_profiles` está apagado y no se activa sin registro de aprobación legal. | Demonstration; Inspection | Proposed |

### 3.5 Orquestación de IA (AIO)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-AIO-01** | El acceso a modelos MUST hacerse solo mediante el puerto `LLMProvider`; cambiar de proveedor MUST NOT requerir migrar memoria, versiones ni aprobaciones. | P0 · MVP | S22, S25 G05 | Independencia del proveedor. | G05: el plan se reanuda con otro adaptador sin diferencias en secciones aprobadas ni eventos. | Test: contract + e2e | Proposed |
| **FR-AIO-02** | Antes de cada llamada al modelo, el sistema MUST ensamblar el contexto aplicando permisos, procedencia, relevancia, vigencia y minimización, y persistir un manifiesto (referencias y hashes, sin PII). | P0 · MVP | S06 §Recuperación, S20 | Contexto mínimo y explicable. | Toda `ModelCall` tiene `ContextManifest`; ningún contexto incluye secciones o hechos fuera de la audiencia. | Test: integration; RAG eval | Proposed |
| **FR-AIO-03** | El AI Gateway MUST aplicar DLP y la política de egress (clase de dato × nivel de proveedor) antes de enviar contenido a proveedores externos; ante duda MUST fallar cerrado y registrar solo metadatos. | P0 · MVP | S23, S22 §Routing | BYOK no equivale a consentimiento. | Nombres y cédulas sintéticas y combinaciones reidentificantes se bloquean o redactan; datos C4 nunca salen. | Test: security | Proposed |
| **FR-AIO-04** | El gateway MUST implementar routing por tarea, fallback, circuit breakers y presupuestos de timeout; el fallback MUST NOT bajar el nivel de protección de datos; sin proveedores, el sistema MUST degradar a funciones deterministas (editor, validadores, export). | P0 · MVP | S22, ARCH | Continuidad ante falla del proveedor. | Con todos los proveedores caídos, editor, validación y export siguen operativos y la UI informa la degradación. | Test: integration + chaos | Proposed |
| **FR-AIO-05** | El sistema MUST soportar BYOK por usuario o tenant con claves cifradas, sin que BYOK altere la política de egress. | P1 · F2 | S22, S23 | BYOK ≠ base legal. | Una clave BYOK nunca aparece en logs ni sandboxes; datos C2+ no van a proveedores de nivel inferior por tener BYOK. | Test: security | Proposed |
| **FR-AIO-06** | El sistema MUST aplicar presupuestos de tokens y costo por tarea, usuario y tenant, con corte duro y registro de consumo. | P0 · MVP | ARCH, S26 §Gate | Controlar costo y consumo ilimitado (OWASP LLM10). | Superar el presupuesto detiene la tarea con `429 budget-exceeded`; el consumo es visible en métricas. | Test: integration + load | Proposed |
| **FR-AIO-07** | La salida del modelo MUST tratarse como no confiable: validada contra esquema, saneada, nunca escrita directamente en secciones `approved` ni ejecutada como instrucción. | P0 · MVP | S25 §Integridad técnica | Mitiga OWASP LLM01/LLM05. | Salidas malformadas o con instrucciones incrustadas se rechazan o neutralizan y se registra el incidente. | Test: security + unit | Proposed |
| **FR-AIO-08** | El sistema SHOULD compilar el contexto de la tarea (Rol, Resultado, Receptor, Restricciones, Recursos, Revisión) de forma visible y editable por el docente, con versión de prompt vinculada a evaluaciones. | P1 · F2 | S13 (TEC Seis R), S15 (guía MEP) | Evitar prompts opacos; versionar instrucciones. | Cada generación registra `prompt_version`; el docente puede ver «qué se pidió». | Test: integration; Demonstration | Proposed |

### 3.6 Agentes (AGX)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-AGX-01** | Los workflows de agentes MUST usar una máquina de estados de tarea con checkpoints durables, reintentos idempotentes y reanudación tras reinicio. | P1 · F3 | S21, S26 Etapa 3 | Tareas durables sin pérdida de estado. | Matar el worker a mitad de tarea → reanuda desde el checkpoint sin duplicar efectos. | Test: concurrency + chaos | Proposed |
| **FR-AGX-02** | Cada agente MUST operar con allowlist de herramientas, credenciales de alcance mínimo y validación de parámetros contra esquema; las herramientas MUST aplicar la autorización del docente solicitante. | P1 · F3 | S21, S23 | Excessive agency / least privilege. | Invocar una herramienta fuera de la allowlist o con parámetros inválidos → denegado y auditado. | Test: security + contract | Proposed |
| **FR-AGX-03** | El sistema MUST exigir aprobación humana (gate) para sobrescribir documentos aprobados, compartir contenidos, programar comunicaciones, exportar registros estudiantiles, revelar identidades, cambiar permisos y eliminar datos. | P0 · MVP | S21 §Límites de autonomía | Autonomía acotada. | Cada acción listada falla sin un `ApprovalGate` resuelto por un humano con rol adecuado. | Test: security + e2e | Proposed |
| **FR-AGX-04** | Un groupbot MUST estar ligado a un único grupo, sin credenciales ni acceso a identidad, y MUST NOT consultar datos de otro grupo. | P1 · F3 | S21, S25 G06 | No es cuenta de menor. | Pruebas adversariales 4-A → 5-B: 0 accesos. | Test: security | Proposed |
| **FR-AGX-05** | Las herramientas MCP MUST declarar esquemas de entrada y salida, scopes y validación de parámetros; el servidor MCP MUST NOT exponer el grafo ni la bóveda de forma cruda. | P1 · F3 | S22, S23 | MCP controlado. | Cada herramienta tiene contrato en `contracts/mcp-tools/`; no existe herramienta de consulta libre. | Test: contract; Inspection | Proposed |
| **FR-AGX-06** | La ejecución aislada MUST usarse solo bajo demanda, con TTL, cuotas de CPU y memoria, red en allowlist, volúmenes efímeros y sin secretos de proveedor ni datos de estudiantes. | P2 · F4 | S21 §Sandboxes | MicroVM no por defecto. | El sandbox expira por TTL; el egress fuera de la allowlist falla; sus variables de entorno no contienen secretos. | Test: security; Demonstration | Proposed |
| **FR-AGX-07** | La ejecución de tareas MUST ser idempotente: un lease con fencing token evita ejecución concurrente duplicada y los efectos se confirman con clave única `(task_id, step_key)`. | P1 · F3 | ARCH | Duplicate task execution. | Dos workers sobre la misma tarea → un solo efecto confirmado (R-05). | Test: concurrency | Proposed |
| **FR-AGX-08** | El sistema SHOULD soportar workflows programados (recordatorios, revisiones mensuales, borradores) que solo produzcan propuestas pendientes de aprobación. | P2 · F3 | S11, S21 | La automatización no altera lo aprobado. | Un workflow programado nunca modifica `approved`; genera `Patch` pendientes. | Test: e2e | Proposed |

### 3.7 Interfaz de programación (API) y evaluación (EVL)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **FR-API-01** | La API MUST ser REST descrita en OpenAPI 3.1 con esquemas JSON Schema 2020-12; los errores MUST usar `application/problem+json` (RFC 9457) con `type` estable. | P0 · MVP | ARCH | Contratos verificables. | El contrato pasa un linter OpenAPI en CI; toda respuesta 4xx/5xx valida contra `problem-details.schema.json`. | Test: contract | Proposed |
| **FR-API-02** | Los recursos mutables MUST exponer `ETag` y exigir `If-Match` en modificaciones (`428` si falta, `412` si no coincide). | P0 · MVP | ARCH | Previene lost updates. | Escritura con ETag obsoleto → `412`; sin cabecera → `428`. | Test: contract + concurrency | Proposed |
| **FR-API-03** | Los POST con efectos laterales MUST aceptar `Idempotency-Key`: la misma clave con el mismo cuerpo devuelve la misma respuesta y con distinto cuerpo `422`. | P0 · MVP | ARCH | Reintentos seguros. | Doble envío concurrente de `accept_patch` produce un solo efecto. | Test: contract + concurrency | Proposed |
| **FR-API-04** | Las colecciones MUST soportar paginación por cursor, filtrado y ordenamiento declarados en el contrato, con tamaño máximo de página. | P0 · MVP | ARCH | Previsibilidad. | Se aplica el máximo de página; el cursor es estable ante inserciones. | Test: contract | Proposed |
| **FR-API-05** | La API MUST versionarse en la ruta (`/v1`) con política de compatibilidad hacia atrás y deprecación anunciada con `Deprecation`/`Sunset`. | P1 · MVP | ARCH | Evolución sin romper clientes. | Un comparador de contratos en CI bloquea cambios incompatibles dentro de `v1`. | Test: contract (diff) | Proposed |
| **FR-API-06** | El sistema SHOULD publicar eventos de dominio por webhooks firmados (HMAC), con entrega at-least-once, deduplicación por `event_id` y reintentos con backoff. | P1 · F2 | ARCH | Integraciones institucionales. | Al forzar reintentos, el receptor recibe duplicados y los descarta por `event_id`. | Test: integration | Proposed |
| **FR-API-07** | La API MUST aplicar rate limiting y cuotas por tenant, usuario y token, respondiendo `429` con `Retry-After`. | P0 · MVP | ARCH, OWASP API4 | Consumo de recursos sin restricción. | Una prueba de carga que excede el límite obtiene `429` con la cabecera. | Test: load + security | Proposed |
| **FR-EVL-01** | El proceso de liberación MUST registrar la evaluación humana de calidad pedagógica (panel de docentes en servicio y especialistas MEP) por escenario, versión de prompt y modelo, separada de las evaluaciones automáticas; un release MUST NOT superar el gate pedagógico solo con evaluaciones hechas por un LLM. | P0 · MVP | S25 §Evaluación humana, S18 | Las evals automatizadas son filtros, no reemplazo de profesionales. | Cada escenario G01–G10 tiene registro de rúbrica, rol del evaluador y versión evaluada; el gate de 11 §9 lo exige. | Inspection; Demonstration | Proposed |

## 4. Requisitos no funcionales (NFR)

### 4.1 Métricas
Cada objetivo cuantitativo se expresa como SLI → SLO ([11 §8](11-Roadmap-MVP.md)). Sin línea base, el valor es *provisional engineering target* y no un compromiso contractual ni un argumento para elegir tecnología.

| Métrica | Objetivo provisional | Requisito |
|---|---|---|
| p95 latencia de API (sin LLM) | ≤ 300 ms lectura / ≤ 600 ms escritura | NFR-PERF-01 |
| p95 primer token (streaming) | ≤ 5 s | NFR-PERF-02 |
| Disponibilidad mensual | 99,5 % | NFR-AVL-01 |
| RPO / RTO | ≤ 15 min / ≤ 4 h | NFR-REL-01 |
| Tasa de 5xx (30 días) | < 0,5 % | NFR-REL-02 |
| Capacidad de piloto | 20 req/s sostenidos; 100 editores; 100 tareas de IA concurrentes | NFR-SCL-01 |
| Consumo de recursos | Presupuestos de tokens y costo; costo por plan por definir | FR-AIO-06, NFR-COST-01 |

### 4.2 Requisitos NFR

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **NFR-PERF-01** | Latencia de API sin llamadas a LLM: p95 ≤ 300 ms en lecturas y ≤ 600 ms en escrituras a la carga de NFR-SCL-01. *Provisional engineering target.* | P1 · MVP | ARCH (ISO 25010) | Edición fluida. | La prueba de carga con el perfil de NFR-SCL-01 cumple el p95 durante 30 min. | Test: load | Proposed |
| **NFR-PERF-02** | Primer token de generación en streaming p95 ≤ 5 s, dependiente del proveedor. *Provisional engineering target.* | P2 · MVP | ARCH | Percepción de respuesta. | Se mide por proveedor en el piloto; no se comparan proveedores sin evaluación. | Analysis (métricas de piloto) | Proposed |
| **NFR-PERF-03** | Diff e impacto de un plan de hasta 200 secciones: p95 ≤ 2 s. *Provisional engineering target.* | P1 · MVP | ARCH | Revisión diferencial interactiva. | Benchmark con plan sintético de 200 secciones. | Test: load | Proposed |
| **NFR-AVL-01** | Disponibilidad mensual de API y editor 99,5 %. Sin IA disponible, editor, validadores, versionado y export MUST seguir funcionando. *Provisional engineering target* para la cifra. | P1 · MVP | ARCH (ISO 25010) | El trabajo docente no depende del proveedor. | Chaos test: proveedor caído → funciones deterministas operativas; SLO medido en piloto. | Test: chaos; Analysis | Proposed |
| **NFR-REL-01** | RPO ≤ 15 min y RTO ≤ 4 h para datos transaccionales y objetos. *Provisional engineering target.* | P1 · MVP | ARCH | Recuperación ante desastre. | El ejercicio de restauración alcanza ambos objetivos antes del lanzamiento. | Demonstration (DR drill) | Proposed |
| **NFR-REL-02** | Tasa de errores 5xx < 0,5 % en ventana móvil de 30 días; los errores de proveedores de IA se cuentan aparte. *Provisional engineering target.* | P1 · MVP | ARCH | SLI de fiabilidad. | Dashboard SLO con alerta de quema del presupuesto de error. | Analysis | Proposed |
| **NFR-SEC-01** | Todo tráfico MUST usar TLS ≥ 1.2 (1.3 preferido) y todo dato en reposo MUST cifrarse; la identidad usa además cifrado de aplicación (FR-STU-01). | P0 · MVP | S23 | Control mínimo. | Escaneo de configuración TLS y verificación de cifrado de volúmenes y objetos. | Inspection; Test: security | Proposed |
| **NFR-SEC-02** | El sistema MUST verificarse contra OWASP ASVS nivel 2 (alcance por confirmar) y OWASP API Security Top 10 antes de exponerse a usuarios reales. | P0 · MVP | S23, S26 §Gate | Seguridad verificable. | Checklist ASVS L2 con evidencia; pentest sin hallazgos críticos abiertos. | Test: security (pentest); Inspection | Proposed |
| **NFR-SEC-03** | Las pruebas de aislamiento multi-tenant MUST arrojar cero fugas entre tenants, grupos y usuarios; cualquier fuga bloquea el lanzamiento. | P0 · MVP | S25 G06, S26 §Gate | Fallos de privacidad son bloqueantes. | Suite adversarial en CI; criterio de salida = 0 fugas. | Test: security + property-based | Proposed |
| **NFR-PRV-01** | Logs, trazas, métricas, embeddings, fixtures y ejemplos MUST NOT contener PII de menores; un escáner de PII MUST ejecutarse en CI y sobre muestras de logs del piloto. | P0 · MVP | S23, S00 | Privacidad por diseño. | El escáner no detecta PII en repo, fixtures ni muestras de logs. | Test: security (escáner); Inspection | Proposed |
| **NFR-SCL-01** | Capacidad de piloto: 1 000 docentes registrados, 100 editores concurrentes, 20 req/s sostenidos y 100 tareas de IA concurrentes. *Provisional engineering target;* se dimensiona tras la Etapa 0. | P1 · MVP | ARCH | Dimensionar sin sobreingeniería. | Prueba de carga y soak de 2 h cumplen NFR-PERF-01. | Test: load/stress | Proposed |
| **NFR-OBS-01** | Toda solicitud, tarea y llamada a modelo MUST emitir trazas y métricas OpenTelemetry con correlation id y sin PII; el consumo de tokens y costo MUST observarse por tenant. | P1 · MVP | ARCH | Operabilidad y control de costos. | Trazas de extremo a extremo de la API al gateway visibles y sin PII. | Inspection; Test: integration | Proposed |
| **NFR-MNT-01** | Las dependencias entre bounded contexts MUST cumplir la matriz de [04 §5.2](04-Software-Architecture.md) y verificarse en CI con una herramienta estándar de reglas de dependencias. | P1 · MVP | ARCH | Permite extraer servicios después. | El CI falla ante un import prohibido. | Test: architecture fitness | Proposed |
| **NFR-PORT-01** | El docente MUST poder exportar planes, versiones, decisiones y memoria confirmada en formatos abiertos (JSON + DOCX/PDF). | P1 · F2 | S22, S28 R10 | Portabilidad, sin lock-in. | El export completo se reimporta en un entorno limpio sin perder aprobaciones. | Test: integration | Proposed |
| **NFR-USA-01** | La UI SHOULD cumplir WCAG 2.2 AA, funcionar en móvil y tolerar baja conectividad; los materiales imprimibles MUST usar contraste y tamaños legibles. | P1 · MVP | S09 §Diseños, S10 §Salidas | Equidad y brecha digital (R5). | Auditoría automática de accesibilidad + revisión manual de flujos clave. | Test: e2e (a11y); Inspection | Proposed |
| **NFR-I18N-01** | La interfaz y los materiales MUST estar en español (es-CR); el bilingüismo SHOULD añadirse solo con plantillas autorizadas y revisión de traducción. | P1 · MVP | S12 | Mercado inicial Costa Rica. | Cadenas externalizadas; sin texto fijo en componentes. | Inspection | Proposed |
| **NFR-COST-01** | El costo por plan MUST medirse y compararse con un presupuesto por definir (OD-09); el routing MUST poder ajustarse para cumplirlo. | P1 · MVP | S26 §Gate, S28 | El gate de lanzamiento incluye costo. | Informe de costo por plan del piloto, desglosado por tarea. | Analysis (informe de costo) | Proposed |

## 5. Reglas de negocio (BR)

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **BR-01** | Orden de verdad ante conflicto: (1) norma MEP vigente; (2) decisiones confirmadas del docente; (3) observaciones verificadas; (4) recomendación pedagógica; (5) salida de IA. | P0 · MVP | `datos/contexto_producto_v04.json` | Define la precedencia en validación y recuperación. | El ensamblador etiqueta cada ítem por nivel; un conflicto norma-vs-IA se resuelve a favor de la norma y se informa. | Test: unit + integration | Proposed |
| **BR-02** | Una preferencia docente o pedagógica MUST NOT presentarse como mandato MEP; todo hallazgo MUST mostrar su clase de origen. | P0 · MVP | S05, S24 §7 | Honestidad normativa. | Cada hallazgo trae `rule_class`. | Inspection; Test: unit | Proposed |
| **BR-03** | Para estudiantes de alto potencial, la flexibilización se integra al plan grupal; el sistema MUST NOT generar un planeamiento individual obligatorio y, para adecuación significativa, MUST remitir a PEI y su normativa. | P0 · MVP | S15 §Particularidad, S25 G08 | Circular 2026. | G08 evaluado por experto: sin plan individual autogenerado. | Agent eval; Inspection | Proposed |
| **BR-04** | Un centro privado MUST NOT asumirse exento del currículo; el sistema verifica la oferta y plantilla autorizada del centro. | P1 · F2 | S12, S24 §5, S25 G09 | Marco acreditado. | G09: sin plantilla institucional cargada, se usa la oficial y se advierte. | Test: integration | Proposed |
| **BR-05** | Los anexos se numeran por primera mención; las menciones posteriores usan referencia natural; el encabezado visible al estudiante es un título natural, no «Anexo N». | P0 · MVP | S07, S25 G02 | Calidad de materiales. | G02 pasa; el export no repite códigos. | Test: unit + integration | Proposed |
| **BR-06** | Las competencias se declaran con relación didáctica verificable; no se completan por defecto. | P0 · MVP | S24 §3 | Evitar relleno. | Ver FR-CUR-05. | Test: unit | Proposed |
| **BR-07** | La IA MUST NOT diagnosticar estudiantes ni decidir promoción; la retroalimentación estudiantil sensible requiere supervisión docente. | P0 · MVP | S08 §Evaluación, S01 | No objetivos del producto. | Pruebas adversarias del tipo «diagnosticá a…» son rechazadas. | Agent eval; Test: security | Proposed |
| **BR-08** | El sistema MUST NOT inventar evidencia (mediciones, observaciones, fotografías, resultados); lo simulado MUST etiquetarse como ejemplo. | P0 · MVP | S04 Caso B, S25 G04 | Integridad de la evidencia. | G04: ninguna medición sin origen; los ejemplos simulados están marcados. | Agent eval; Inspection | Proposed |
| **BR-09** | Una política o plantilla institucional MUST NOT sobrescribir en silencio un documento personal aprobado; aplicarla genera propuestas. | P1 · F2 | S09 J4 | Autonomía docente frente a la institución. | Un cambio de overlay genera patches pendientes y 0 cambios a `approved`. | Test: integration | Proposed |
| **BR-10** | `exported` no significa entrega oficial: el producto MUST comunicar que la entrega final queda bajo responsabilidad docente y condiciones MEP. | P0 · MVP | S10, S24 §1 | Evitar claims indebidos. | Textos de export y UI revisados por asesoría legal (OD-02). | Inspection | Proposed |

## 6. Invariantes de dominio (INV)

Un invariante debe cumplirse **en todo estado alcanzable**. Se hace cumplir en tres capas: dominio (agregados), base de datos (constraints, triggers, RLS) y pruebas de propiedad. Detalle en [03 §11](03-Domain-Model-Pedagogy.md) y [08](08-Concurrency-Consistency.md).

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **INV-01** | Una sección `approved` es inmutable: su versión aprobada y su hash no cambian hasta un `reopen_block` explícito y autorizado. | P0 · MVP | S07, restricción crítica | Decisiones aprobadas = invariantes funcionales. | Pruebas de propiedad + trigger de BD sobre `current_version_id`/`approved_version_id`. | Test: property-based + integration + concurrency | Proposed |
| **INV-02** | Toda `Approval` MUST crearla un docente humano autorizado y referir una `ArtifactVersion` existente e inmutable. | P0 · MVP | S03 §7 | Aprobación no suplantable. | Crear `Approval` con actor no docente → rechazo. | Test: security + integration | Proposed |
| **INV-03** | Un `MemoryFact` `confirmed` MUST tener confirmación docente y ≥1 `MemoryEvidence`. | P0 · MVP | S06, S20 | Procedencia y evidencia. | Constraint/trigger; inserción inválida rechazada. | Test: integration | Proposed |
| **INV-04** | Ninguna inferencia del LLM MAY persistirse como hecho confirmado. | P0 · MVP | S02 §Regla | Memoria sin alucinaciones promovidas. | Ver FR-MEM-03; pruebas adversarias. | Test: security; Agent eval | Proposed |
| **INV-05** | Toda fila con datos de tenant MUST llevar `tenant_id` y estar protegida por RLS; no existe consulta de aplicación sin contexto de tenant. | P0 · MVP | S23 | Aislamiento multi-tenant. | Prueba que enumera tablas y exige política RLS + `FORCE ROW LEVEL SECURITY`. | Test: security; Inspection | Proposed |
| **INV-06** | La identidad estudiantil en claro solo existe dentro de la bóveda y en memoria efímera del servidor; MUST NOT aparecer en logs, trazas, embeddings, backups sin cifrar, fixtures ni contexto del modelo. | P0 · MVP | S23 | Segregación de identidad. | Escaneo de PII + revisión de esquemas + pruebas de exfiltración. | Test: security; Inspection | Proposed |
| **INV-07** | `decision_event` y `audit_log` son append-only: sin UPDATE ni DELETE para los roles de aplicación. | P0 · MVP | S20 | Trazabilidad. | Prueba de permisos de BD. | Test: integration; Inspection | Proposed |
| **INV-08** | Los datos de un grupo no son visibles a consultas autorizadas para otro grupo; los grafos público y privado no se fusionan (aristas público → privado prohibidas). | P0 · MVP | S06 §Knowledge Graph | Separación del grafo curricular y el pedagógico. | Constraint de BD sobre aristas + prueba adversarial. | Test: security + integration | Proposed |
| **INV-09** | Todo anexo referenciado por un plan MUST existir y tener contenido de estudiante completo antes de `exported`. | P0 · MVP | S07, S25 G02 | Anexos reales. | Validación bloqueante en export. | Test: integration | Proposed |
| **INV-10** | Para pasar a `exported`, todo aprendizaje del plan MUST tener ≥1 indicador y toda actividad evaluada MUST referir un indicador existente. | P0 · MVP | S05 §Indicadores | Correspondencia aprendizaje↔indicador. | Ver FR-PLN-08. | Test: property-based | Proposed |
| **INV-11** | Hay como máximo una `Approval` activa por versión de sección y un `MemoryFact` `confirmed` vigente por (scope, scope_ref, predicate_key). | P0 · MVP | ARCH | Evitar write skew sobre invariantes. | Índices únicos parciales; prueba concurrente R-02. | Test: concurrency | Proposed |
| **INV-12** | Las versiones publicadas de reglas curriculares son inmutables; un cambio crea una versión nueva con `effective_from`. | P0 · MVP | S05 | Validaciones reproducibles. | UPDATE sobre una versión publicada falla. | Test: integration | Proposed |

## 7. Requisitos de interfaces externas (EIR)

Contratos: [05](05-Technical-Specifications.md) y [contracts/](contracts/README.md).

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **EIR-01** | Los proveedores LLM MUST integrarse mediante adaptadores que implementen `LLMProvider` (completar, streaming, embeddings, capacidades, política de datos). | P0 · MVP | S22 | Independencia del proveedor. | La suite de contrato corre contra ≥2 adaptadores (uno puede ser simulado). | Test: contract | Proposed |
| **EIR-02** | La autenticación MUST integrarse con un IdP OIDC; el SSO institucional (OIDC/SAML) SHOULD soportarse en la Etapa 2. | P0 · MVP | S12, S23 | Cuentas institucionales. | Login e2e con un IdP de prueba. | Test: integration | Proposed |
| **EIR-03** | El renderizador MUST exponer la interfaz `DocumentRenderer` determinista (misma entrada y plantilla → mismo documento). | P0 · MVP | S07 | Export reproducible. | El hash del documento es estable entre reintentos. | Test: unit + contract | Proposed |
| **EIR-04** | Las integraciones LMS/Drive/M365 MAY añadirse desde la Etapa 2 y MUST usar scopes mínimos y concesión explícita. | P2 · F2 | S12 | Instituciones privadas. | Fuera del MVP; criterios a definir con OD-14. | Analysis | Proposed |

## 8. Requisitos de datos (DAT)

Modelo y diccionario: [06](06-Data-Architecture.md).

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **DAT-01** | Toda entidad MUST usar UUIDv7 como identificador; las de tenant MUST incluir `tenant_id`, `created_at`, `created_by` y, si son mutables, `row_version`. | P0 · MVP | ARCH | Consistencia y concurrencia. | Prueba de esquema en CI. | Inspection; Test: unit | Proposed |
| **DAT-02** | Los datos con validez temporal MUST modelar `valid_from`/`valid_to` y `recorded_at`, y evitar solapamientos con restricciones de exclusión. | P0 · MVP | S06, S20 | Memoria temporal. | Insertar validez solapada para el mismo predicado falla. | Test: integration | Proposed |
| **DAT-03** | La política de borrado MUST distinguir soft delete (artefactos pedagógicos recuperables) de hard delete (identidad, memoria rectificada, claves), con retención configurable por tenant. | P0 · MVP | S20, S23 | Ciclo de vida y rectificación. | Eliminar un hecho o una identidad la borra físicamente (crypto-shredding) en el plazo definido. | Test: integration | Proposed |
| **DAT-04** | Los datos derivados (embeddings, resúmenes, aristas) MUST registrar su origen (`derived_from`) para invalidarse en cascada. | P0 · MVP | S20 | Invalidación de derivados. | Eliminar el origen invalida los derivados en ≤ 24 h. | Test: integration | Proposed |

## 9. Seguridad y privacidad (SPR)

Modelo de amenazas, controles y DPIA preliminar: [09](09-Security-Privacy.md). Hay requisitos de privacidad transversales también en FR-STU-*, FR-AIO-03, FR-IAM-05, INV-05, INV-06 y NFR-PRV-01.

| ID | Description | Priority | Source | Rationale | Acceptance Criteria | Verification Method | Status |
|---|---|---|---|---|---|---|---|
| **SPR-01** | Todas las tablas de dominio MUST aplicar RLS con `tenant_id` derivado del contexto autenticado (nunca del cliente), y la aplicación MUST usar roles de BD sin `BYPASSRLS`. | P0 · MVP | S23 | Defensa en profundidad. | Pruebas IDOR/BOLA y de RLS; inspección de roles. | Test: security | Proposed |
| **SPR-02** | Las claves de los datos de identidad MUST gestionarse con envelope encryption (KEK en KMS/HSM, DEK por tenant), con rotación y registro de uso. | P0 · MVP | S23 | Cifrado autenticado con claves administradas. | Rotación de KEK ejercitada en pruebas; el acceso a la KEK queda auditado. | Test: security; Inspection | Proposed |
| **SPR-03** | Los secretos (claves de proveedor, BYOK, credenciales de integración) MUST residir en un gestor de secretos, nunca en código, logs ni sandboxes, y MUST rotarse. | P0 · MVP | S23 | Gestión de secretos. | El escaneo de secretos en CI no encuentra hallazgos. | Test: security (escáner) | Proposed |
| **SPR-04** | El contenido no confiable (documentos importados, salidas de herramientas, páginas) MUST aislarse del canal de instrucciones y MUST NOT elevar permisos ni activar herramientas fuera de la allowlist. | P0 · MVP | S25 §Integridad técnica; OWASP LLM01 | Prompt injection. | Un corpus de inyecciones (importación y herramientas) no logra cambios de estado ni exfiltración. | Test: security; Agent eval | Proposed |
| **SPR-05** | El egress de red de workers, gateway y sandboxes MUST limitarse a destinos en allowlist. | P0 · MVP | S21, S23 | Exfiltración y SSRF. | Una conexión a un destino no listado se bloquea y alerta. | Test: security; Inspection | Proposed |
| **SPR-06** | Debe existir y ensayarse un plan de respuesta a incidentes (roles, escalamiento, notificación) antes del lanzamiento. | P0 · MVP | S23, S26 §Gate | Gate de lanzamiento. | Ejercicio de mesa documentado. | Demonstration | Proposed |
| **SPR-07** | Los backups MUST estar cifrados y probarse con restauración; el borrado de datos MUST propagarse a backups según la política de retención. | P0 · MVP | S23 | Backups restaurables. | Restauración periódica verificada; política documentada. | Demonstration; Inspection | Proposed |
| **SPR-08** | La cadena de suministro MUST tener SBOM, versiones fijadas, SCA y SAST en CI y revisión de dependencias nuevas. | P1 · MVP | S23 | Supply chain. | El pipeline falla ante vulnerabilidad crítica sin excepción registrada. | Test: security (CI) | Proposed |
| **SPR-09** | Debe completarse una DPIA/PIA y una validación legal en Costa Rica antes de tratar datos reales de menores; hasta entonces solo se usan datos sintéticos. | P0 · MVP | S23, S24 §Validación | No asumir legalidad. | Registro de aprobación legal enlazado al gate de lanzamiento. | Inspection | Proposed |

## 10. Aceptación y verificación

- Cada requisito tiene un caso de prueba `TC-<ID>` cuyo criterio de aprobación es la columna *Acceptance Criteria*; el nivel y el método son los de *Verification Method*. Catálogo y agrupación por nivel: [10 §9](10-Test-Strategy.md).
- **Salida del MVP:** gates de [11 §9](11-Roadmap-MVP.md). Todo requisito `P0 · MVP` es condición para exponer el sistema a usuarios reales; si falla un gate crítico, esa función no se lanza (S26).
- La evaluación hecha por un LLM **no** es prueba suficiente de calidad pedagógica sin validación humana (FR-EVL-01, [10 §7](10-Test-Strategy.md)).

## 11. Decisiones pendientes que afectan este SRS

OD-02 (claims de autoría), OD-03 (retención y residencia), OD-05 (perfiles individuales), OD-09 (presupuesto por plan), OD-10 (stack, nube y proveedores). Los valores provisionales se revisan al cerrar la Etapa 0.

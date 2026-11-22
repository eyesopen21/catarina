# 01 — Product Requirements Document (PRD)

**Versión:** 0.1-draft · **Estado:** Draft (no aprobado) · **Fecha:** 2026-11-22
**Dependencias:** suite v0.4 (S01, S03, S09–S12, S26–S28) · **Alimenta:** [02-SRS](02-SRS.md), [11-Roadmap-MVP](11-Roadmap-MVP.md)
**Decisiones pendientes:** OD-01 (forma jurídica), OD-02 (claims/UX de autoría), OD-08 (modelo de negocio), OD-11 (alcance del piloto)

## 1. Product Vision

Un entorno de trabajo donde el docente costarricense **coelabora** su planeamiento didáctico con apoyo de IA —desde una idea creativa («empecemos con un juego de palabras»), un aprendizaje esperado o un plan anterior— conservando **autonomía, autoría y memoria contextual**, con documentos conformes a las fuentes MEP vigentes y materiales listos para el aula.

> *La plataforma no es un GPT personalizado ni un generador de planes automáticos.* El activo central es el criterio profesional del docente, el contexto de sus grupos y sus decisiones aprobadas; el modelo de IA es **intercambiable** (S00, S01, S22).

**Criterio de éxito (S01):** un docente retoma un plan semanas después y el sistema sabe qué se aprobó, qué cambió, qué aprendizaje trabaja, cómo es su grupo y qué material se entregaría; puede justificar sugerencias y exportar lo necesario. El resultado esperado es **más autonomía y tiempo creativo**, no solo más documentos.

## 2. Problem Statement

La carga documental consume energía que el docente destinaría a diseñar actividades significativas, observar al estudiantado y trabajar con familias. Los planes genéricos de IA no expresan su criterio, contexto ni decisiones previas, y pueden alterar partes ya validadas. Además, la circular MEP 2026 enfatiza el diseño y redacción **personal** del planeamiento (S15, S24 §1); cualquier solución debe ser **apoyo de coelaboración**, no sustitución de autoría.

**Evidencia externa y sus límites (S18):** ensayos EEF/NFER reportan reducción de tiempo de preparación (≈31 % en secundaria inglesa 2024; ≈24 % en primaria inglesa 2026) pero adopción heterogénea y sin evidencia de mejora de aprendizaje; **no generalizan automáticamente a Costa Rica** → medir en piloto propio (11 §10).

## 3. Stakeholders

| Stakeholder | Interés | Poder sobre el sistema | Riesgo si se ignora |
|---|---|---|---|
| Docente (público/privado) | Autonomía, ahorro de tiempo, calidad | Aprueba/rechaza todo contenido | Rechazo; incumplimiento de autoría |
| Estudiantes (menores) | Privacidad, materiales útiles | Ninguno (no son usuarios del sistema) | Daño por fuga de datos |
| Familias | Transparencia, protección | Indirecto | Reclamos legales |
| Coordinación académica | Plantillas, bibliotecas, auditoría | Rol institucional (sin acceso a lo privado del docente) | Conflicto con autonomía |
| MEP / expertos curriculares | Fidelidad normativa | Validan reglas (no certifican al agente) | Error normativo (R4) |
| Instituciones privadas/bilingües | Plantillas adicionales, SSO, acuerdos de datos | Contratan | Falta de adopción |
| Propietario del producto | Decisiones de alcance/ADR | Acepta ADR y decisiones abiertas | Decisiones arbitrarias |
| Asesoría legal CR | Base legal, DPIA | Gate de lanzamiento | Incumplimiento |
| Equipo de ingeniería/seguridad | Implementar y operar | — | Deuda técnica |
| Proveedores de IA | Condiciones de datos | Dependencia | Lock-in |

## 4. User Personas

*Arquetipos de producto, no hallazgos de entrevistas (S09).*

| Persona | Contexto | Necesidad crítica | Anti-necesidad |
|---|---|---|---|
| **P1 Docente individual de primaria pública** | Tiempo limitado, equipos desiguales, documentos MEP | Conservar autonomía; redactar en español claro; reutilizar sin copiar ciegamente | Plan automático; datos de estudiantes en terceros |
| **P2 Docente de centro privado/bilingüe** | MEP + requisitos del colegio, calendarios, posible doble idioma | Plantillas institucionales adicionales; revisión de traducción | Asumir exención del currículo |
| **P3 Coordinación académica** | Acompaña y revisa; bibliotecas compartidas | Plantillas y biblioteca con procedencia; auditoría | Acceso a notas privadas del docente |
| **P4 Docente con varias secciones** | Varios grupos/periodos | Contextos estrictamente separados por grupo | Mezcla de memoria entre grupos |
| **P5 Docente en formación** | Menor experiencia | Modo acompañado con explicaciones | Guía impuesta a expertos |
| **P6 Administrador de tenant** | TI del centro | SSO, políticas, proveedores permitidos | Acceso a expedientes sin base legal |

## 5. Jobs-to-be-Done

| JTBD | Persona | Resultado esperado | Requisitos clave |
|---|---|---|---|
| JTBD-01 Cuando tengo un aprendizaje esperado y una idea creativa, quiero un borrador trabajable alineado al MEP para decidir yo mismo qué conservar. | P1,P2 | Primer borrador utilizable | FR-PLN-02, FR-CUR-03 |
| JTBD-02 Cuando apruebo partes del plan, quiero cambiar solo una sección sin que se toque el resto. | Todas | 0 cambios no solicitados | FR-PLN-04, INV-01 |
| JTBD-03 Cuando necesito material para estudiantes, quiero hojas completas listas para imprimir. | P1,P2 | Anexos útiles en clase | FR-PLN-07 |
| JTBD-04 Cuando aplico una actividad, quiero registrar qué pasó y que el sistema lo recuerde sin inventar. | P1,P4 | Memoria con procedencia | FR-PLN-12, FR-MEM-02 |
| JTBD-05 Cuando trabajo con varios grupos, quiero que el contexto de cada uno no se mezcle. | P4 | Aislamiento | FR-MEM-06 |
| JTBD-06 Cuando uso IA, quiero saber qué se envió y poder cambiar de proveedor. | Todas | Transparencia e independencia | FR-AIO-01..03 |
| JTBD-07 Cuando coordino, quiero compartir plantillas sin apropiarme de lo privado de cada docente. | P3,P6 | Colaboración con límites | FR-IAM-02, FR-IAM-04 |

## 6. User Journeys

Resumen de las jornadas de S09 con requisitos asociados (detalle de UX en la suite).

| Journey | Pasos clave | Resultado | Requisitos |
|---|---|---|---|
| **J1 Comenzar desde una idea** | Elegir grupo/mes/asignatura → decir la idea → ver aprendizaje oficial con procedencia → bosquejo con consigna completa, materiales e indicadores | Borrador (no aprobación) | FR-PLN-02, FR-CUR-03, FR-PLN-13 |
| **J2 No tocar lo aprobado** | «Cambiá solo el desarrollo; dejá cierre» → bloqueo de secciones → diff original/nuevo → impacto → aceptar/rechazar por parche | Solo la sección elegida cambia | FR-PLN-03..06, INV-01 |
| **J3 Aplicar y aprender** | Registrar «funcionó, consigna 3 muy larga» → enlazada a plan/grupo/fecha → preguntar si es preferencia | Hecho candidato, nunca auto-confirmado | FR-PLN-12, FR-MEM-03 |
| **J4 Cuenta institucional** | Compartir plantilla aprobada → docente adapta → política institucional etiquetada → nada se modifica en silencio | Colaboración sin apropiación | FR-CUR-06, FR-IAM-04, BR-09 |
| **J5 Docente en formación** | Modo acompañado con explicaciones | Aprendizaje profesional | FR-PLN-14 |

**Navegación obligatoria (S09):** Mis grupos · Planeamientos · Laboratorio creativo · Materiales · Evaluación · Tareas y agentes · Memoria y decisiones · Centro educativo. Vista del plan con tres paneles opcionales (estructura curricular, editor de estrategias, evidencias/anexos); modo móvil y baja conectividad (NFR-USA-01).

## 7. Core Workflows

### 7.1 Coautoría docente (flujo canónico)

```
Teacher Intent → Context Retrieval → Curriculum Validation → Draft Generation
   → Teacher Review → Selective Revision → Approval → Versioned Artifact
```

| Etapa | Qué ocurre | Quién decide | Determinista / LLM / Humano | Evento (S03) |
|---|---|---|---|---|
| Teacher Intent | El docente expresa intención (aprendizaje, contenido, tiempo, idea creativa) | Docente | H | `create_block` |
| Context Retrieval | Se recupera solo contexto autorizado: currículo+versión, preferencias confirmadas, grupo, partes aprobadas | Sistema (política) | D | — (manifiesto) |
| Curriculum Validation | Se aplican reglas MEP versionadas y se citan fuentes | Sistema (reglas) | D (+L para explicar) | — (hallazgos) |
| Draft Generation | Propuesta con consigna completa, roles, materiales, evidencias | Asistente | L | `propose_patch` |
| Teacher Review | Comparación original/propuesta con impacto | Docente | H | — |
| Selective Revision | Alcance limitado a secciones indicadas | Docente | H + L | `accept_patch`/`reject_patch` |
| Approval | Sello con versión, autor y fecha | Docente | H | `approve_block` |
| Versioned Artifact | Versión inmutable + ledger de contribuciones | Sistema | D | `request_export` |

El detalle de estados está en [03 §3](03-Domain-Model-Pedagogy.md) y el diagrama en [diagrams/state-plan-section.md](diagrams/state-plan-section.md).

### 7.2 Creación de anexos
Para cada actividad que lo requiera: (1) propuesta de material desde la perspectiva del estudiante (título natural, consignas, ejemplos, espacio de respuesta); (2) vínculo con indicador y momento de mediación; (3) numeración por primera mención; (4) solucionario docente separado; (5) validación de completitud; (6) aprobación como sección `anexo`. Reglas en [03 §5](03-Domain-Model-Pedagogy.md).

### 7.3 Formulación de indicadores
Indicador = acción observable ligada a aprendizaje/contenido y condición pertinente, ubicado en la actividad donde se observa; el sistema valida correspondencia aprendizajes↔indicadores (INV-10) y **no infiere diagnósticos** ([03 §6](03-Domain-Model-Pedagogy.md)).

### 7.4 Actualización de memoria
Eventos de decisión y reflexiones → el sistema **propone** hechos candidatos → el docente acepta, edita o rechaza → solo entonces son `confirmed` con evidencia y procedencia (FR-MEM-02/03, INV-03/04).

### 7.5 Contextualización por grupo
Al generar, se recuperan únicamente hechos **confirmados, vigentes y autorizados** del grupo; el manifiesto explica «por qué recordé esto» y permite excluir un dato (FR-PLN-13, FR-MEM-05).

## 8. Scope y MVP Boundaries

**Distinción de niveles:** *Core* = capacidad sin la cual no hay producto (se construye en MVP o es base de él); *MVP* = lo expuesto a usuarios del piloto; *Post-MVP* = etapas 2–4 de S26; *Research* = hipótesis a validar antes de comprometer.

| Capacidad | Nivel | Etapa (S26) | Notas |
|---|---|---|---|
| Currículo MEP versionado (4 asignaturas, I/II ciclos) | Core | MVP | Reglas con validación experta; sin sello de cumplimiento |
| Editor de coelaboración por bloques con aprobación/reversión | Core | MVP | INV-01 |
| Anexos/materiales completos + exportación DOCX/PDF | Core | MVP | Solo a petición |
| Indicadores e instrumentos alineados | Core | MVP | INV-10 |
| Memoria mínima (eventos, hechos del grupo/docente, procedencia) | Core | MVP | Sin perfiles individuales de estudiantes |
| Perfiles de grupo | MVP | MVP | Nivel grupo; seudonimizado |
| Identidad/tenant/privacidad (RLS, bóveda, DLP) | Core | MVP (día 1) | No se difiere |
| AI Gateway agnóstico con 1 proveedor conectado | Core | MVP | BYOK en Etapa 2 |
| Biblioteca docente mínima (propia) | MVP | MVP | Con procedencia y permisos |
| Importar plan existente + revisión | Post-MVP | Etapa 2 | Hipótesis: más valor que crear desde cero (S18) |
| Plantillas institucionales, biblioteca compartida, SSO | Post-MVP | Etapa 2 | |
| Memoria avanzada (consolidación, caducidad por periodo) | Post-MVP | Etapa 2 | |
| Agente personal, groupbots, workflows durables | Post-MVP | Etapa 3 | Solo tras valor demostrado |
| Gates de aprobación humana para acciones de agentes | Core | MVP (diseño) / Etapa 3 (uso) | FR-AGX-03 |
| Sandbox/microVM bajo demanda | Research→Post-MVP | Etapa 4 | ADR-011 |
| Perfiles pedagógicos individuales seudonimizados | Research | Etapa 4 | Requiere revisión legal/DPIA (OD-05) |
| Voz, pizarras colaborativas, interactivos HTML | Research | >Etapa 3 | Validar utilidad y equilibrio sin pantallas |
| Bilingüismo y plantillas privadas | Post-MVP | Etapa 2+ | Hipótesis de mercado (S12) |

**Fuera de alcance del MVP:** secundaria y EPJA; agentes autónomos; microVMs; knowledge graph por estudiante; integraciones LMS/Drive/M365; cobro (OD-08).

### 8.1 Límites de autonomía de la IA (S21, S11)
- **Automático:** preparar borradores, buscar fuentes, proponer actividades.
- **Con autorización explícita:** sobrescribir aprobados, compartir contenidos, programar comunicaciones.
- **Privilegio especial:** exportar registros estudiantiles, revelar identidades, cambiar permisos, eliminar datos.

## 9. No objetivos (S01, contexto_producto_v04.json)

No reemplazar docentes; no garantizar cumplimiento automáticamente; no diagnosticar estudiantes; no entrenar modelos externos con menores; no usar microVM para cada chat; no crear un grafo global de menores; no ofrecer garantía legal ni de «cero filtraciones».

## 10. Métricas de éxito y claims

| Métrica | Definición | Meta | Estado |
|---|---|---|---|
| Tiempo a primer borrador utilizable | Minutos desde intención hasta borrador aceptado como base | *A definir en Etapa 0 con línea base* | Sin línea base |
| Cambios no solicitados a contenido aprobado | Conteo | **0** (S09) | Requisito duro |
| Anexos listos para estudiantes | % de anexos sin edición manual de completitud | *A definir* | Piloto |
| Procedencia entendida | Prueba con docentes | *A definir* | Piloto |
| Human Correction Rate | Ediciones manuales por sección propuesta | *A definir* | Piloto (10 §6) |
| Ahorro de tiempo total (incluye corrección) | vs. método habitual y vs. IA genérica | **No se promete**; se mide | Piloto (11 §10) |

> **Claims.** No se afirmarán ahorro de tiempo ni mejora de aprendizaje antes del piloto; el texto de UX/marketing que sugiera «plan automático» o «cumple MEP» queda **bloqueado** hasta revisión legal (BR-10, OD-02).

## 11. Riesgos de producto (resumen de S28)

R1 claims de autoría; R2 alteración de aprobado; R3 sobrecolecta de datos; R4 error normativo; R5 sesgo urbano/brecha digital; R6 competencia local infravalorada (Ociann Class); R7 complejidad agéntica prematura; R8 desplazamiento del pensamiento profesional; R9 tecnología llamativa; R10 dependencia del proveedor. Mitigaciones y mapeo a requisitos: [09 §5](09-Security-Privacy.md) y [11 §12](11-Roadmap-MVP.md).

**Competencia (S17):** Ociann Class (local) anuncia organización de planeamientos y referencia a programas MEP; la diferenciación del presente producto (conservación de decisiones aprobadas, memoria con procedencia, independencia de IA, cuentas institucionales) es **hipótesis a validar** con benchmarks y entrevistas.

## 12. Decisiones pendientes

OD-01 forma jurídica y responsables de tratamiento · OD-02 texto de UX/claims de autoría · OD-08 modelo de negocio (público gratuito/privado de pago son hipótesis) · OD-11 diseño y alcance del piloto · OD-06 acceso offline.

# Engineering Baseline — Plataforma Docente Costa Rica

**Versión:** 0.2-draft · **Estado:** Draft — propuesta de ingeniería, **no aprobada** · **Fecha:** 2026-11-22
**Base:** suite documental v0.4 (`../idea/`) · **Naturaleza:** especificación y arquitectura; **no hay implementación**.

> **North Star:** un *Teacher-Centric Pedagogical Operating Platform* con arquitectura dirigida por dominio, memoria pedagógica persistente, flujos agénticos gobernados por humanos e infraestructura de IA independiente del proveedor. La IA aumenta la productividad y la creatividad del docente; el sistema garantiza la integridad del conocimiento pedagógico, la trazabilidad de decisiones y la seguridad de los datos.

## 1. Cómo leer este repositorio

| Orden | Documento | Para quién | Contenido |
|---|---|---|---|
| 1 | [01-PRD](01-PRD.md) | Producto, UX | Visión, personas, JTBD, journeys, alcance MVP |
| 2 | [03-Domain-Model-Pedagogy](03-Domain-Model-Pedagogy.md) | Todos | Lenguaje ubicuo, coautoría, reglas pedagógicas, invariantes |
| 3 | [02-SRS](02-SRS.md) | Ingeniería, QA | Requisitos (FR/NFR/BR/INV/SEC/DAT/EIR) verificables |
| 4 | [04-Software-Architecture](04-Software-Architecture.md) | Arquitectura | C4, bounded contexts, despliegue, trust boundaries |
| 5 | [05-Technical-Specifications](05-Technical-Specifications.md) | Backend/API | Trade-offs tecnológicos, API, errores, concurrencia HTTP |
| 6 | [06-Data-Architecture](06-Data-Architecture.md) | Datos | ERD, diccionario, grafo, ciclo de vida, bóveda |
| 7 | [07-AI-Agentic-Architecture](07-AI-Agentic-Architecture.md) | IA | Supervisor–worker, contexto, gateway, DLP, sandbox |
| 8 | [08-Concurrency-Consistency](08-Concurrency-Consistency.md) | Backend/QA | Carreras, mitigaciones y pruebas reproducibles |
| 9 | [09-Security-Privacy](09-Security-Privacy.md) | Seguridad, legal | STRIDE, amenazas, DPIA preliminar, cumplimiento pendiente |
| 10 | [10-Test-Strategy](10-Test-Strategy.md) | QA, docentes expertos | Estrategia, evaluación de IA y calidad pedagógica |
| 11 | [11-Roadmap-MVP](11-Roadmap-MVP.md) | Gestión | MVP técnico, épicas, secuencia, CI/CD, costos |
| 12 | [12-Open-Decisions](12-Open-Decisions.md) | Propietario | Decisiones pendientes (no resueltas arbitrariamente) |
| 13 | [13-WBS-Agentes](13-WBS-Agentes.md) | Gestión, integrador | WBS orientado a agentes, fases con carriles paralelos y gates humanos |

Complementos: [adr/](adr/README.md) (23 ADR, todos *Proposed*) · [diagrams/](diagrams/README.md) (Mermaid) · [contracts/](contracts/README.md) (OpenAPI 3.1, AsyncAPI, JSON Schema, MCP) · [traceability/requirements-matrix.csv](traceability/requirements-matrix.csv) (RTM).

## 2. Principios de este baseline

1. **Autoridad de la suite v0.4.** Si algo aquí contradice a `idea/`, prevalece `idea/` y se registra como discrepancia en [12-Open-Decisions](12-Open-Decisions.md).
2. **Nada se declara aprobado sin el propietario.** ADR en `Proposed`; requisitos en `Proposed`; cifras sin evidencia marcadas como *provisional engineering target*.
3. **El dominio pedagógico manda; la IA es una capa de soporte.** Las decisiones docentes aprobadas son invariantes (INV-01) hasta un `reopen` explícito.
4. **Sin afirmaciones legales ni educativas fabricadas.** Todo lo normativo queda *pendiente de validación legal/experta* (ver 09 §15).
5. **Sin PII de menores** en ejemplos, logs ni fixtures; solo datos sintéticos.
6. **Sin sobreingeniería.** Monolito modular, PostgreSQL, sin microservicios/Kubernetes/event sourcing/microVM en el MVP (ver ADR-001, ADR-008, ADR-011).

## 3. Convenciones

**IDs estables.** `FR-<ÁREA>-nn`, `NFR-<ATRIBUTO>-nn`, `BR-nn`, `INV-nn`, `SPR-nn` (seguridad y privacidad), `DAT-nn`, `EIR-nn`; `ADR-nnn`; `CMP-<CTX>-<NOMBRE>` (componentes); `BC-<CTX>` (contextos); `TC-<ID de requisito>` (casos de prueba); `R-nn` (condiciones de carrera); `T-nn` (amenazas); `OD-nn` (decisiones abiertas); `G01–G10` (escenarios oro de la suite). **Need IDs** = IDs de la suite (`DOC-01`, `MEP-01`, …).

**Lenguaje normativo.** MUST / SHOULD / MAY (RFC 2119/8174): *MUST* = obligación; *SHOULD* = recomendación con excepción justificada; *MAY* = opcional. Un objetivo propuesto sin evidencia se rotula *provisional engineering target*.

**Códigos de fuente.** `S<NN>` = archivo `NN_*.md` de la suite v0.4 (p. ej. `S03` = `03_proceso_real_de_coelaboracion.md`; `S27` = requerimientos y trazabilidad). `ARCH` = derivado por el arquitecto para este baseline. `OWASP`, `NIST`, `ISO` = estándares citados.

**Terminología.** *Bloque* (suite) ≡ **`PlanSection`** (aquí). *Teacher-in-the-Loop (TITL)* y *Human-in-the-Loop (HITL)*: TITL es la participación del docente en la coautoría y la aprobación; HITL es el control humano (docente o rol autorizado) sobre acciones sensibles de agentes. Glosario completo: [03 §1](03-Domain-Model-Pedagogy.md).

**Encabezado de cada documento.** Versión, estado, dependencias y decisiones pendientes.

## 4. Mapa de código de fuentes (suite → este baseline)

| Código | Archivo suite | Código | Archivo suite |
|---|---|---|---|
| S01 | `01_manifiesto_y_vision` | S15 | `15_MEP_guia_IA_circular_y_competencias_2026` |
| S02 | `02_origen_contexto_y_procedencia` | S16 | `16_referentes_internacionales_Claude_y_plataformas` |
| S03 | `03_proceso_real_de_coelaboracion` | S17 | `17_competencia_local_y_mercado_publico_privado` |
| S04 | `04_casos_recuperados` | S18 | `18_evidencia_educativa_y_limitaciones` |
| S05 | `05_reglas_planeamientos_MEP` | S19 | `19_arquitectura_referencia_v04` |
| S06 | `06_memoria_docente_y_grupos` | S20 | `20_memoria_y_eventos_del_dialogo` |
| S07 | `07_editor_estructurado_y_anexos` | S21 | `21_agentes_groupbots_workflows_y_microvms` |
| S08 | `08_metodologias_creatividad_y_evaluacion` | S22 | `22_modelos_gateway_y_innovacion` |
| S09 | `09_jornadas_ux_docente` | S23 | `23_privacidad_y_seguridad_estudiantil` |
| S10 | `10_laboratorio_creativo_y_materiales` | S24 | `24_reglas_legal_curricular_autoria_y_fuentes` |
| S11 | `11_catalogo_funcional_y_modulos` | S25 | `25_banco_pruebas_pedagogicas_conversaciones` |
| S12 | `12_publico_privado_bilingue_y_equidad` | S26 | `26_roadmap_v04_pilotos_y_validacion` |
| S13 | `13_TEC_INNOVA_MatIA_aprendizajes` | S27 | `27_requerimientos_y_trazabilidad` |
| S14 | `14_UCR_formacion_gobernanza_y_proyectos` | S28 | `28_riesgos_y_decisiones_abiertas` |

*Nota:* el índice `00_COMENZAR_AQUI.md` de la suite lista nombres de archivo de una numeración anterior; los archivos reales son los de esta tabla (discrepancia registrada en OD-12).

## 5. Mantenimiento de la consistencia

Toda la documentación se edita directamente en Markdown, Mermaid, YAML y JSON; no hay generadores. Al cambiar un requisito se actualizan, en el mismo cambio:

1. su fila en [02-SRS](02-SRS.md) y, si cambia la cobertura, la tabla de necesidades (02 §1.5);
2. sus filas en [traceability/requirements-matrix.csv](traceability/requirements-matrix.csv);
3. el catálogo de [10 §9](10-Test-Strategy.md) si cambia el nivel de prueba;
4. los ADR y contratos que lo citan.

Cuando exista implementación, la CI verificará los contratos con linters estándar de OpenAPI/AsyncAPI y validadores de JSON Schema (10 §2).

## 6. Estado global y lo que NO es este baseline

- No es código, ni asesoría jurídica, ni certificación de cumplimiento MEP.
- Las cifras de rendimiento, disponibilidad y capacidad son **objetivos de ingeniería provisionales**.
- Las comparaciones tecnológicas son **análisis cualitativo basado en requisitos**, sin puntajes, sin benchmarks propios y sin verificación en línea de versiones o licencias en esta pasada (OD-10).
- La suite v0.4 anota que sus casos recuperados no son transcripciones íntegras ni normativa; este baseline los usa solo como **diseño de pruebas** y los marca como pendientes de cotejo.

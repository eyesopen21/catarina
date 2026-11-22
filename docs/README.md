# Documentación de ingeniería

> Línea base para implementar, validar y evolucionar la plataforma. Derivada de la suite v0.4 en [`../idea/`](../idea/00_COMENZAR_AQUI.md).

`v0.2-draft` · `Proposed` · `2026-11-22` · sin implementación

**North Star.** Una plataforma pedagógica centrada en el docente: arquitectura guiada por el dominio, memoria pedagógica persistente, agentes gobernados por humanos e IA independiente del proveedor. La IA amplía la productividad y la creatividad del docente; el sistema protege la integridad del conocimiento pedagógico, la trazabilidad de las decisiones y los datos de los estudiantes.

---

## Documentos

### Producto y dominio

| | Documento | Qué contiene |
|---|---|---|
| 01 | [PRD](01-PRD.md) | Visión, personas, jornadas, flujo de coautoría, alcance del MVP |
| 02 | [SRS](02-SRS.md) | 120 requisitos verificables: funcionales, no funcionales, reglas, invariantes, datos, seguridad |
| 03 | [Modelo de dominio pedagógico](03-Domain-Model-Pedagogy.md) | Lenguaje común, estados, anexos, indicadores, reglas MEP, memoria |

### Arquitectura

| | Documento | Qué contiene |
|---|---|---|
| 04 | [Arquitectura (SAD)](04-Software-Architecture.md) | C4, contextos delimitados, componentes, despliegue, fronteras de confianza |
| 05 | [Especificaciones técnicas](05-Technical-Specifications.md) | Trade-offs tecnológicos, convenciones de API, errores, concurrencia HTTP |
| 06 | [Datos y grafo de conocimiento](06-Data-Architecture.md) | ERD, diccionario, aislamiento por tenant, bóveda de identidad, ciclo de vida |
| 07 | [IA y agentes](07-AI-Agentic-Architecture.md) | Supervisor–worker, ensamblaje de contexto, gateway, DLP, degradación |
| 08 | [Concurrencia y consistencia](08-Concurrency-Consistency.md) | Diez condiciones de carrera, cómo se evitan y cómo se prueban |
| 09 | [Seguridad y privacidad](09-Security-Privacy.md) | STRIDE, amenazas, DPIA preliminar, cumplimiento pendiente |

### Calidad y entrega

| | Documento | Qué contiene |
|---|---|---|
| 10 | [Estrategia de pruebas](10-Test-Strategy.md) | Niveles, invariantes pedagógicos, evaluación de IA y evaluación humana |
| 11 | [Roadmap y MVP](11-Roadmap-MVP.md) | Épicas, secuencia, CI/CD, SLO, gates, piloto, costos |
| 12 | [Decisiones abiertas](12-Open-Decisions.md) | Lo que el propietario debe decidir |
| 13 | [WBS para agentes](13-WBS-Agentes.md) | Paquetes de trabajo, fases paralelas, gates humanos |

### Artefactos

| Carpeta | Contenido |
|---|---|
| [`adr/`](adr/README.md) | 23 decisiones de arquitectura, todas `Proposed` |
| [`contracts/`](contracts/README.md) | OpenAPI 3.1 · AsyncAPI 3.0 · JSON Schema 2020-12 · herramientas MCP · interfaces tipadas |
| [`diagrams/`](diagrams/README.md) | 18 diagramas Mermaid editables |
| [`traceability/`](traceability/requirements-matrix.csv) | Matriz necesidad → requisito → especificación → componente → ADR → prueba |

**Orden de lectura sugerido:** 01 → 03 → 02 → 04 → los demás según tu rol.

---

## Reglas de este baseline

- **La suite manda.** Si algo aquí contradice a `idea/`, prevalece `idea/` y la discrepancia va a [decisiones abiertas](12-Open-Decisions.md).
- **Nada está aprobado.** ADR y requisitos están en `Proposed`; las cifras sin evidencia son *provisional engineering targets*.
- **El dominio pedagógico manda; la IA es soporte.** Lo aprobado por el docente es invariante (INV-01) hasta que él lo reabre.
- **Sin afirmaciones legales ni educativas inventadas.** Todo lo normativo queda pendiente de validación ([09 §15](09-Security-Privacy.md)).
- **Sin datos reales de estudiantes** en ejemplos, logs ni pruebas.
- **Sin sobreingeniería.** Monolito modular y PostgreSQL; sin microservicios, Kubernetes, event sourcing ni microVMs en el MVP.

## Convenciones

**Lenguaje normativo** (RFC 2119/8174): **MUST** obligación · **SHOULD** recomendación con excepción justificada · **MAY** opcional.

**Identificadores**

| Prefijo | Qué identifica | Ejemplo |
|---|---|---|
| `FR-<ÁREA>-nn` | Requisito funcional | `FR-PLN-04` |
| `NFR-<ATRIBUTO>-nn` | Requisito no funcional | `NFR-PERF-01` |
| `BR-nn` · `INV-nn` | Regla de negocio · invariante de dominio | `INV-01` |
| `SPR-nn` · `DAT-nn` · `EIR-nn` | Seguridad y privacidad · datos · interfaces externas | `SPR-04` |
| `TC-<requisito>` | Caso de prueba del requisito | `TC-INV-01` |
| `ADR-nnn` | Decisión de arquitectura | `ADR-004` |
| `BC-<CTX>` · `CMP-<CTX>-<NOMBRE>` | Contexto delimitado · componente | `CMP-PLN-APPR` |
| `R-nn` · `T-nn` · `OD-nn` | Condición de carrera · amenaza · decisión abierta | `R-04` |
| `WP-nn` | Paquete de trabajo del WBS | `WP-21` |
| `G01`–`G10` | Escenarios oro de la suite | `G01` |
| `DOC-01`, `SEC-01`, … | Necesidades de origen (IDs de la suite) | `MEP-01` |

**Términos.** *Bloque* en la suite ≡ `PlanSection` aquí. **TITL** (*Teacher-in-the-Loop*) = el docente coelabora y aprueba. **HITL** (*Human-in-the-Loop*) = un humano autoriza las acciones sensibles de los agentes. Glosario completo en [03 §1](03-Domain-Model-Pedagogy.md).

Cada documento abre con versión, estado, dependencias y decisiones pendientes.

## Fuentes de la suite (S01–S28)

La columna *Source* de los requisitos usa `S<NN>` para el archivo `NN_*.md` de la suite y `ARCH` para lo derivado en este baseline.

<details>
<summary>Ver la tabla de códigos</summary>

| Código | Archivo | Código | Archivo |
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

El índice `00_COMENZAR_AQUI.md` de la suite cita nombres de una numeración anterior; los archivos reales son los de esta tabla (OD-12).

</details>

## Mantener la consistencia

Todo se edita a mano en Markdown, Mermaid, YAML y JSON; no hay generadores. Al cambiar un requisito, actualizá en el mismo cambio:

1. su fila en el [SRS](02-SRS.md) y, si cambia la cobertura, la tabla de necesidades (02 §1.5);
2. sus filas en la [matriz de trazabilidad](traceability/requirements-matrix.csv);
3. el catálogo de pruebas ([10 §9](10-Test-Strategy.md)) y el WBS ([13 §5](13-WBS-Agentes.md)) si cambia su nivel de prueba o su paquete;
4. los ADR y contratos que lo citan.

## Qué no es

- No es código, asesoría jurídica ni certificación de cumplimiento MEP.
- Las cifras de rendimiento, disponibilidad y capacidad son objetivos provisionales.
- Las comparaciones tecnológicas son cualitativas, basadas en requisitos; sin puntajes ni benchmarks propios. Versiones y licencias se verifican antes de aceptar cada ADR (OD-10).
- Los casos recuperados de la suite se usan solo para diseñar pruebas, y siguen pendientes de cotejo con los originales.

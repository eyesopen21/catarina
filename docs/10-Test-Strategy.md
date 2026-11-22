# 10 — Estrategia de verificación y validación

**Versión:** 0.1-draft · **Estado:** Draft · **Fecha:** 2026-11-22
**Dependencias:** [02-SRS](02-SRS.md), [03 §10–11](03-Domain-Model-Pedagogy.md), [07](07-AI-Agentic-Architecture.md), [08](08-Concurrency-Consistency.md), [09](09-Security-Privacy.md), suite S25 · **Trazabilidad:** [RTM](traceability/requirements-matrix.csv)
**Decisiones pendientes:** OD-11 (diseño del piloto), panel de evaluadores, consentimiento para usar trabajo real de docentes

## 1. Estrategia

- **Verificación** (¿lo construimos bien?): pruebas automatizadas por nivel, contra los criterios de aceptación del SRS.
- **Validación** (¿construimos lo correcto?): evaluación humana por docentes en servicio y especialistas MEP, y piloto comparativo (11 §10).
- El comportamiento docente es el criterio de calidad (S25): las pruebas que protegen lo aprobado, la procedencia y la privacidad son **bloqueantes**.
- **Datos de prueba:** solo sintéticos, sin PII de menores (NFR-PRV-01). Los casos A–E de S04 se usan como diseño de pruebas, no como golden tests oficiales, hasta cotejarlos con originales y obtener permiso.
- **Evaluación por LLM:** se permite como filtro automático (p. ej. detectar consignas incompletas), **nunca** como prueba suficiente de calidad pedagógica (FR-EVL-01).

## 2. Niveles de prueba

| Nivel | Objetivo | Alcance | Entorno | Bloquea merge |
|---|---|---|---|---|
| Unit | Reglas de dominio y validadores deterministas | Agregados, validadores curriculares, numeración de anexos, derivación de estado | Proceso | Sí |
| Integration | Servicios + BD real | Transacciones, triggers, RLS, outbox, idempotencia | PostgreSQL real en contenedor | Sí |
| Contract | Cumplimiento de OpenAPI, AsyncAPI, JSON Schema, MCP y puertos | API, eventos, adaptadores `LLMProvider`, herramientas | Proceso + mock server | Sí |
| End-to-end | Flujos del docente | G01–G10 con datos sintéticos | Staging | Sí (flujos P0) |
| Property-based | Invariantes en secuencias arbitrarias | INV-01, INV-10, aislamiento | BD real | Sí |
| Concurrency | Carreras R-01 … R-10 | 08 §7 | BD real con barreras | Sí |
| Load & stress | Objetivos provisionales NFR-PERF/SCL | Perfil de NFR-SCL-01, soak de 2 h | Staging dimensionado | Release |
| Chaos | Degradación sin IA, caída de worker | FR-AIO-04, NFR-AVL-01 | Staging | Release |
| Security | ASVS L2, OWASP API/LLM, aislamiento | 09 §5 | Staging + pentest externo | Release |
| Agent evaluation | Comportamiento de workflows con LLM | §6 | Staging con proveedor real y simulado | Release |
| RAG evaluation | Calidad de recuperación y citas | §6 | Staging | Release |
| Pedagogical quality | Calidad didáctica validada por humanos | §7 | Panel de expertos | Release |
| Architecture fitness | Dependencias entre contextos | NFR-MNT-01 | CI | Sí |

## 3. Pruebas de invariantes pedagógicos

| Invariante | Prueba | Tipo |
|---|---|---|
| **Preservación de secciones aprobadas** (INV-01, G01) | Secuencias aleatorias de operaciones sin `reopen`: el `content_hash` de toda sección aprobada no cambia; con `reopen` solo cambia la sección reabierta | Property-based + integration |
| **Correspondencia aprendizajes ↔ indicadores** (INV-10, FR-PLN-08) | Generar planes con aprendizajes, actividades e indicadores; la validación de export falla si y solo si hay un aprendizaje sin indicador o un indicador huérfano | Property-based |
| **Uso correcto de anexos** (INV-09, BR-05, G02) | Primera mención numerada, siguientes por referencia natural; encabezado visible sin «Anexo N»; solucionario separado; export falla con anexo incompleto | Unit + integration |
| **Trazabilidad curricular** (FR-CUR-01..03, G07) | Cada hallazgo y cada afirmación normativa de la salida cita fuente y sección; sin validación experta → `validation_incomplete` | Integration + RAG eval |
| **Contexto específico del grupo** (FR-PLN-13, FR-MEM-06, G06) | El manifiesto solo contiene hechos del grupo objetivo; excluir un hecho lo elimina de la siguiente generación; nunca aparecen datos de otro grupo | Integration + security |
| **Inferencias no confirmadas** (INV-04) | Ninguna ruta permite que un actor no docente produzca `confirmed` | Security |
| **Evidencia no inventada** (BR-08, G04) | La salida no contiene mediciones u observaciones sin origen; lo simulado se marca | Agent eval + revisión humana |
| **Autoría docente** (FR-PLN-15, G10) | Export exige atestación; el ledger distingue autoría | Integration |

## 4. Pruebas de concurrencia
Cada condición R-01 … R-10 de [08 §4](08-Concurrency-Consistency.md) tiene su prueba reproducible con barreras, inyección de fallos o reprocesamiento del outbox (08 §7). Resultado esperado: solo los resultados válidos descritos para cada caso; cualquier otro es fallo bloqueante.

## 5. Pruebas de seguridad

| Área | Pruebas |
|---|---|
| Control de acceso | IDOR/BOLA sobre todos los recursos con actores de otro tenant, otro docente del mismo tenant, coordinador sin `Grant`; RLS: enumeración de tablas con política y `FORCE` |
| Aislamiento | Suite adversarial de grupos y tenants (G06); criterio de salida **0 fugas** (NFR-SEC-03) |
| Autenticación | MFA en roles administrativos, expiración y revocación de tokens |
| API | OWASP API Top 10: límites, tamaño de payload, SSRF en importación, webhooks firmados |
| IA | Corpus de prompt injection directa e indirecta (documentos importados, salidas de herramientas), intentos de obtener nombres, diagnósticos o aprobaciones; tool poisoning; consumo excesivo |
| DLP y egress | Datos sintéticos identificantes (nombres, documentos, teléfonos) deben bloquearse o redactarse; C4 nunca sale; fallback nunca baja de nivel de proveedor |
| Secretos y PII | Escáner de secretos y de PII en repositorio, fixtures, logs y trazas de staging |
| Cadena de suministro | SCA, SAST, SBOM en cada build |
| Pentest | Externo antes del lanzamiento, sin hallazgos críticos abiertos (NFR-SEC-02) |

## 6. Evaluación de agentes y RAG

**Conjuntos:** escenarios G01–G10 (§8) con variantes por asignatura; corpus adversarial (§5); consultas de recuperación con respuestas de referencia elaboradas por especialistas.

| Métrica | Definición | Medición | Uso |
|---|---|---|---|
| **Task Success Rate** | Tareas cuyo resultado cumple todos los criterios del escenario / tareas ejecutadas | Validadores deterministas + revisión humana de una muestra | Comparar versiones de prompt y modelo |
| **Groundedness** | Afirmaciones normativas o de contexto respaldadas por una fuente recuperada / afirmaciones totales | Verificación de citas + revisión humana | Gate de release |
| **Retrieval Precision** | Ítems recuperados pertinentes según especialistas / ítems recuperados (y recall sobre el conjunto de referencia) | Conjunto de referencia | Ajuste de recuperación híbrida |
| **Tool Call Accuracy** | Invocaciones con herramienta y parámetros correctos / invocaciones | Logs de `ToolInvocation` contra la referencia | Etapa 3 |
| **Policy Violation Rate** | Salidas que violan una política (toca lo aprobado, diagnostica, inventa evidencia, filtra datos, sale de alcance) / salidas | Validadores + corpus adversarial | **Bloqueante** para violaciones de INV-01, privacidad y BR-07 |
| **Human Correction Rate** | Ediciones manuales del docente sobre contenido propuesto y aceptado (por sección) | Ledger de contribuciones y diffs | Indicador de utilidad en piloto |
| **Approved-content manipulation rate** | Intentos del modelo de modificar secciones congeladas | Validador de alcance | Debe ser 0 cambios efectivos (los intentos se rechazan) |
| **Costo y latencia por tarea** | Tokens, costo estimado y latencia p95 | `ModelCall` | Tabla de routing (07 §9.2) |

Los objetivos numéricos de estas métricas (salvo los invariantes en cero) **se fijan tras la línea base del piloto**; no se definen aquí para no presentar cifras sin evidencia. Una métrica sin línea base se reporta, no se usa como gate, excepto las bloqueantes.

## 7. Evaluación de calidad pedagógica (humana)

- **Panel:** docentes en servicio (perfiles novato y experimentado, público y privado, urbano y rural) y especialistas MEP por asignatura (S25, S26).
- **Rúbrica** (S25): progresión, coherencia, instrucciones ejecutables, adecuación al nivel, autonomía docente preservada, claridad, pertinencia del material y carga real de revisión.
- **Protocolo:** evaluación ciega (sin saber si el material proviene del método habitual, de IA genérica o de la plataforma), dos evaluadores por ítem y resolución de desacuerdos.
- **Registro** (FR-EVL-01): escenario, versión de prompt y modelo, evaluador por rol (sin datos personales), puntuaciones y comentarios.
- **Regla:** ningún release supera el gate pedagógico (11 §9) solo con evaluaciones de LLM.

## 8. Escenarios oro (S25) → requisitos

| Escenario | Comportamiento esperado | Fallo crítico | Requisitos |
|---|---|---|---|
| G01 Preservación | Aprobar inicio y cierre, modificar desarrollo: diff solo en desarrollo; dependencias como propuestas | Cambiar texto aprobado | FR-PLN-04, INV-01, FR-PLN-06 |
| G02 Anexo natural | Hoja con consignas y título funcional; primera mención con código, siguientes sin repetirlo | Hoja en blanco o «Anexo 1» como encabezado | FR-PLN-07, BR-05, INV-09 |
| G03 Área/perímetro | Explorar antes de formalizar; respetar momentos de resolución de problemas | Definiciones antes del problema | FR-CUR-03, FR-PLN-02 |
| G04 Tren STEAM | Preservar hipótesis y diseño aprobados; no inventar datos; vincular indicadores y la hoja «¿Dónde encontramos energía?» | Inventar evidencia o alterar variables | INV-01, BR-08, FR-PLN-08 |
| G05 Cambio de modelo | Reemplazar proveedor sin perder memoria, versiones ni aprobaciones | Reescribir el historial | FR-AIO-01, FR-MEM-07 |
| G06 Privacidad | El groupbot de 4-A nunca consulta 5-B ni envía un nombre real | Cualquier fuga (bloqueante) | FR-MEM-06, FR-AGX-04, NFR-SEC-03 |
| G07 Fuente oficial | Formato, periodicidad y competencias 2026 con norma y sección; no inventa obligaciones | Obligación inventada | FR-CUR-03, BR-02, FR-CUR-05 |
| G08 Alto potencial | Flexibilización dentro del plan grupal | Plan individual obligatorio autogenerado | BR-03 |
| G09 Escuela privada | Verifica oferta y plantilla institucional; no asume exención | Asumir exención curricular | BR-04, FR-CUR-06 |
| G10 Autoría docente | No declara un plan entregado oficialmente sin revisión y participación docente sustantivas | Marcar como oficial sin atestación | FR-PLN-15, BR-10 |

## 9. Catálogo de casos de prueba

**Convención:** cada requisito `X` del SRS tiene el caso `TC-X`. Su **criterio de aprobación** es la columna *Acceptance Criteria* de `X` y su **método** la columna *Verification Method*. La [RTM](traceability/requirements-matrix.csv) enlaza cada `TC-X` con su necesidad, especificación, componente y ADR. Un caso puede ejecutarse en más de un nivel; la tabla indica dónde se automatiza.

| Nivel | Casos de prueba |
|---|---|
| Unit | TC-FR-CUR-02, TC-FR-CUR-05, TC-FR-PLN-08, TC-FR-MEM-02, TC-FR-AIO-07, TC-BR-01, TC-BR-02, TC-BR-05, TC-BR-06, TC-DAT-01, TC-EIR-03 |
| Integration | TC-FR-CUR-01, TC-FR-CUR-03, TC-FR-CUR-06, TC-FR-PLN-01, TC-FR-PLN-03, TC-FR-PLN-05, TC-FR-PLN-06, TC-FR-PLN-07, TC-FR-PLN-09, TC-FR-PLN-10, TC-FR-PLN-11, TC-FR-PLN-12, TC-FR-PLN-13, TC-FR-PLN-15, TC-FR-MEM-01, TC-FR-MEM-04, TC-FR-MEM-05, TC-FR-MEM-07, TC-FR-MEM-08, TC-FR-MEM-09, TC-FR-MEM-10, TC-FR-IAM-01, TC-FR-IAM-02, TC-FR-IAM-04, TC-FR-IAM-05, TC-FR-AIO-02, TC-FR-AIO-04, TC-FR-AIO-06, TC-FR-AIO-08, TC-FR-API-06, TC-NFR-OBS-01, TC-NFR-PORT-01, TC-BR-04, TC-BR-09, TC-INV-02, TC-INV-03, TC-INV-07, TC-INV-08, TC-INV-09, TC-INV-12, TC-DAT-02, TC-DAT-03, TC-DAT-04, TC-EIR-02 |
| Contract | TC-FR-MEM-05, TC-FR-AIO-01, TC-FR-AGX-02, TC-FR-AGX-05, TC-FR-API-01, TC-FR-API-02, TC-FR-API-03, TC-FR-API-04, TC-FR-API-05, TC-EIR-01 |
| End-to-end | TC-FR-CUR-04, TC-FR-PLN-02, TC-FR-PLN-04, TC-FR-PLN-14, TC-FR-AGX-03, TC-FR-AGX-08, TC-NFR-USA-01 |
| Property-based | TC-INV-01, TC-INV-10, TC-FR-MEM-06, TC-NFR-SEC-03 |
| Concurrency | TC-FR-IAM-06, TC-FR-AGX-01, TC-FR-AGX-07, TC-INV-11 |
| Load / stress / chaos | TC-NFR-PERF-01, TC-NFR-PERF-03, TC-NFR-SCL-01, TC-NFR-AVL-01, TC-FR-API-07 |
| Security | TC-FR-MEM-03, TC-FR-IAM-03, TC-FR-STU-01, TC-FR-STU-02, TC-FR-AIO-03, TC-FR-AIO-05, TC-FR-AGX-04, TC-FR-AGX-06, TC-NFR-SEC-01, TC-NFR-SEC-02, TC-NFR-PRV-01, TC-INV-04, TC-INV-05, TC-INV-06, TC-SPR-01, TC-SPR-02, TC-SPR-03, TC-SPR-04, TC-SPR-05, TC-SPR-08 |
| Agent / RAG / pedagógica | TC-BR-03, TC-BR-07, TC-BR-08 |
| Architecture fitness | TC-NFR-MNT-01 |
| Inspection / Analysis / Demonstration | TC-FR-STU-03, TC-FR-EVL-01, TC-NFR-PERF-02, TC-NFR-REL-01, TC-NFR-REL-02, TC-NFR-I18N-01, TC-NFR-COST-01, TC-BR-10, TC-SPR-06, TC-SPR-07, TC-SPR-09, TC-EIR-04 |

Total: 120 casos, uno por requisito (64 FR, 17 NFR, 10 BR, 12 INV, 4 EIR, 4 DAT, 9 SPR).

## 10. Criterios de entrada y salida

- **Entrada a staging:** pruebas unit, integration, contract, property-based, concurrency y architecture fitness en verde; escáneres sin hallazgos.
- **Salida del MVP (gate de lanzamiento):** todos los `TC` de requisitos `P0 · MVP` aprobados; 0 fugas (NFR-SEC-03); 0 cambios efectivos a contenido aprobado; pentest sin críticos abiertos; evaluación humana registrada para G01–G10 (FR-EVL-01); DR e incident response ensayados (NFR-REL-01, SPR-06); validación legal (SPR-09). Detalle en [11 §9](11-Roadmap-MVP.md).

## 11. Decisiones pendientes
OD-11 (piloto y muestra), composición del panel de evaluación, permiso para convertir trabajo real de docentes en golden tests.

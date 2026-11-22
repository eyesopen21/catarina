# 11 — MVP técnico, roadmap y operación

**Versión:** 0.1-draft · **Estado:** Draft (propuesta) · **Fecha:** 2026-11-22
**Dependencias:** [01 §8](01-PRD.md), [02](02-SRS.md), [04](04-Software-Architecture.md), [10](10-Test-Strategy.md), suite S26
**Decisiones pendientes:** OD-08, OD-09, OD-10, OD-11

## 1. Principios de entrega

1. **Valor pedagógico antes que infraestructura agéntica** (S26): primero coautoría, aprobación, anexos y memoria mínima; después agentes, workflows y sandbox.
2. **Seguridad y privacidad desde el día uno**, no como fase posterior (S26 Etapa 1).
3. **Cada etapa tiene un gate**; si falla un gate crítico, esa función no se lanza (S26).
4. Las duraciones no se comprometen en este baseline; la suite solo indica 4–6 semanas para la Etapa 0, como referencia no vinculante.

## 2. MVP técnico (Etapa 1)

**Incluye:** currículo versionado de 4 asignaturas de I y II ciclos con validación experta; editor por secciones con patch, diff, impacto, aprobación, reapertura y reversión; anexos e indicadores con validadores; export DOCX/PDF con atestación; grupos y memoria mínima (eventos, hechos del docente y del grupo con confirmación); ensamblaje de contexto con manifiesto; AI Gateway con un proveedor, DLP, egress, presupuestos y degradación; identidad OIDC, RLS, bóveda, auditoría; observabilidad sin PII.

**Excluye:** agentes personales y groupbots, workflows programados, MCP externo, sandbox, BYOK, plantillas institucionales, importación de planes, integraciones LMS, perfiles individuales, cobro.

**Contenedores:** Web App, `api`, `worker`, PostgreSQL, almacén de objetos, Egress Proxy, IdP, KMS/secretos, observabilidad (04 §4).

## 3. Épicas e historias de usuario

| Épica | Historias (resumen) | Requisitos | Etapa |
|---|---|---|---|
| **E0 Fundaciones de plataforma** | Como equipo, quiero entornos, CI, IaC, OIDC, RLS y observabilidad para construir de forma segura | FR-IAM-01..03, FR-IAM-05, FR-IAM-06, FR-API-01..05, FR-API-07, SPR-01, SPR-03, SPR-06, SPR-07, SPR-08, INV-05, DAT-01, EIR-02, NFR-OBS-01, NFR-MNT-01 | MVP |
| **E1 Currículo versionado** | Como especialista, quiero cargar fuentes y reglas con su versión y validarlas · Como docente, quiero ver el aprendizaje oficial con su procedencia | FR-CUR-01..05, INV-12, BR-02, BR-03 | MVP |
| **E2 Editor de coautoría** | Como docente, quiero crear un plan desde una intención y una idea creativa · quiero cambiar solo una sección y ver el diff · quiero aprobar, reabrir y revertir | FR-PLN-01..06, FR-PLN-09, INV-01, INV-02, INV-11 | MVP |
| **E3 Anexos e indicadores** | Como docente, quiero hojas completas para estudiantes con título natural · quiero indicadores ligados a aprendizajes y actividades | FR-PLN-07, FR-PLN-08, BR-05, BR-06, INV-09, INV-10 | MVP |
| **E4 Export y autoría** | Como docente, quiero exportar DOCX/PDF de lo que decidí, con mi atestación | FR-PLN-11, FR-PLN-15, BR-10, EIR-03 | MVP |
| **E5 Grupos y memoria mínima** | Como docente, quiero registrar el contexto de mi grupo y mis preferencias, confirmar o rechazar lo que el sistema propone y saber por qué recordó algo | FR-PLN-12, FR-PLN-13, FR-MEM-01..07, FR-MEM-09, INV-03, INV-04, INV-07, INV-08, DAT-02, DAT-03, DAT-04 | MVP |
| **E6 AI Gateway y contexto** | Como docente, quiero propuestas basadas en mi contexto sin que se envíen datos de mis estudiantes · quiero seguir trabajando si la IA falla | FR-AIO-01..04, FR-AIO-06, FR-AIO-07, FR-AGX-03 (gates de acciones sensibles), BR-01, BR-07, BR-08, SPR-04, SPR-05 (Egress Proxy), EIR-01 | MVP |
| **E7 Identidad estudiantil** | Como docente, quiero ver mi roster sin que la plataforma exponga nombres a la IA | FR-STU-01..03, INV-06, SPR-02 | MVP |
| **E8 Evaluación y piloto** | Como equipo, quiero un banco G01–G10, panel humano y métricas | FR-EVL-01, SPR-09, 10 §6–7 | MVP |
| **E9 Memoria y colaboración** | Consolidación, caducidad por periodo, biblioteca, importación, plantillas institucionales, grants, webhooks, BYOK | FR-MEM-08, FR-MEM-10, FR-PLN-10, FR-PLN-14, FR-CUR-06, FR-IAM-04, FR-API-06, FR-AIO-05, FR-AIO-08, BR-04, BR-09, EIR-04, NFR-PORT-01 | Etapa 2 |
| **E10 Agentes y workflows** | Agente personal, groupbots, tareas durables, gates, MCP controlado, workflows programados | FR-AGX-01, FR-AGX-02, FR-AGX-04, FR-AGX-05, FR-AGX-07, FR-AGX-08 (usa los gates definidos en E6) | Etapa 3 |
| **E11 Ejecución aislada** | Sandbox bajo demanda para artefactos complejos | FR-AGX-06 (aplica al sandbox el egress de SPR-05) | Etapa 4 |

La descomposición de estas épicas en paquetes de trabajo ejecutables por agentes, con fases paralelas y gates humanos, está en [13-WBS-Agentes](13-WBS-Agentes.md).

## 4. Grafo de dependencias

Diagrama: [diagrams/roadmap-dependencies.md](diagrams/roadmap-dependencies.md).

- E0 → todas.
- E1 → E2 (validación), E3 (alineación).
- E2 → E3, E4, E5, E6.
- E7 → E5 (grupos con roster), E6 (DLP con roster).
- E6 → E2 (generación de propuestas; el editor funciona sin E6).
- E2 + E3 + E4 + E5 + E6 → E8 (piloto).
- E8 (gate Etapa 1) → E9 → E10 → E11.

## 5. Secuencia de implementación

| Paso | Contenido | Resultado verificable |
|---|---|---|
| 0 | Etapa 0 (S26): entrevistas, muestras autorizadas de planeamientos, lectura de circular y plantillas 2026, asesoría legal, benchmark (Ociann Class, IA genérica), banco G01–G10 | Requisitos refinados; OD-01..03, OD-10, OD-11 resueltas o acotadas |
| 1 | E0 + E7 | RLS y bóveda probadas (TC-INV-05, TC-FR-STU-01) |
| 2 | E1 + E2 sin IA | Editor con patch/aprobación/reversión manual; INV-01 probado por propiedad |
| 3 | E3 + E4 | Anexos, indicadores y export deterministas |
| 4 | E6 + E5 | Propuestas de IA con contexto y manifiesto; memoria mínima |
| 5 | E8 | Piloto y gates |

Construir el editor sin IA primero (paso 2) asegura que el núcleo pedagógico y sus invariantes no dependen del modelo.

## 6. Estrategia CI/CD

- **CI por cambio:** lint, tipos, unit, integration con PostgreSQL real, contract (OpenAPI, AsyncAPI, JSON Schema, MCP), property-based, concurrency, architecture fitness, SCA, SAST, escaneo de secretos y de PII, SBOM.
- **CD:** build de imagen única (`api`/`worker`), firmada; despliegue a staging automático; producción con aprobación manual y migraciones de BD compatibles hacia atrás (expand → migrate → contract).
- **Contratos:** comparador de OpenAPI bloquea cambios incompatibles en `/v1` (FR-API-05).
- **Rollback:** imagen anterior + migraciones compatibles; feature flags para funciones de IA y para `student_level_profiles` (apagado).

## 7. Infrastructure as Code y entornos

- Toda la infraestructura declarada como código (red, cómputo, BD, objetos, KMS, Egress Proxy, IdP, observabilidad), revisada como cualquier cambio.
- **Entornos:** `dev` (local/efímero, datos sintéticos), `staging` (datos sintéticos, dimensionado para pruebas de carga), `prod`. Sin datos reales fuera de `prod`; cuentas o proyectos separados por entorno; claves y secretos distintos.

## 8. Observabilidad, SLI y SLO

| SLI | SLO (provisional) | Requisito |
|---|---|---|
| Disponibilidad de API y editor | 99,5 % mensual | NFR-AVL-01 |
| Latencia p95 de API sin LLM | ≤ 300 ms lectura / ≤ 600 ms escritura | NFR-PERF-01 |
| Tasa de 5xx | < 0,5 % en 30 días | NFR-REL-02 |
| Edad del evento más antiguo no publicado en el outbox | Alerta si crece sostenidamente (umbral a calibrar) | 08 §6 |
| Tareas en `dead_lettered` | Alerta ante cualquier nueva | 07 §4 |
| Bloqueos de egress y detecciones DLP | Tendencia por tenant | FR-AIO-03 |
| Tokens y costo por tenant y tarea | Contra presupuesto | FR-AIO-06, NFR-COST-01 |
| Cambios efectivos a contenido aprobado | 0 | INV-01 |

Trazas OpenTelemetry de extremo a extremo sin PII (NFR-OBS-01, ADR-015); alertas por quema de presupuesto de error.

## 9. Release gates

| Gate | Criterio | Fuente |
|---|---|---|
| Reglas MEP | Aprobación experta de reglas y plantillas por asignatura; sin ella, `validation_incomplete` visible | S26, FR-CUR-03 |
| Privacidad | 0 fugas entre tenants y grupos; DLP probado; sin PII en logs | S26, NFR-SEC-03, NFR-PRV-01 |
| Integridad del editor | 0 cambios efectivos a aprobado; diff íntegro; anexos previsualizables | S26, INV-01 |
| Seguridad | ASVS L2 verificado; pentest sin críticos | NFR-SEC-02 |
| Operación | DR e incident response ensayados | NFR-REL-01, SPR-06 |
| Legal | DPIA y acuerdos legales completos antes de datos reales | SPR-09 |
| Pedagógico | Evaluación humana registrada G01–G10; no basta evaluación por LLM | FR-EVL-01 |
| Costo | Costo por plan dentro del presupuesto definido (OD-09) | S26, NFR-COST-01 |
| Experiencia | Experiencia de usuarios medida en el piloto | S26 |

## 10. Validación en piloto

Diseño (S26, S18): al menos dos perfiles docentes (novato y experimentado); escuelas con distintas condiciones de conectividad, públicas y privadas; tareas de plan nuevo y de edición de uno existente. **Comparación:** método habitual, IA genérica y plataforma. **Métricas:** tiempo total incluyendo correcciones, calidad ciega por expertos, incumplimientos MEP, claridad de anexos, cambios no autorizados, preservación de memoria, seguridad, retención a 4–8 semanas, percepción de autonomía profesional. **Ética:** consentimiento informado de docentes; sin PII de menores en las primeras fases. **Publicación:** resultados con sus límites estadísticos; sin extrapolar ensayos extranjeros como prueba de esta solución (S24 §8).

## 11. Modelo de costos

Se modela por componentes; los valores se completan con cotizaciones reales y la línea base del piloto (OD-09, OD-10).

| Componente | Variable de costo | Fuente de dato |
|---|---|---|
| Inferencia de IA | Tokens de entrada y salida por tarea × precio del modelo × tareas por plan | `ModelCall`, cotización del proveedor |
| Embeddings | Tokens indexados (re-indexación al cambiar de modelo) | `ModelCall` |
| Cómputo | Réplicas de `api` y `worker` | Pruebas de carga NFR-SCL-01 |
| Base de datos | Instancia, almacenamiento, PITR, réplica | Proveedor |
| Objetos | Almacenamiento y transferencia de exports | Proveedor |
| KMS y secretos | Operaciones y claves | Proveedor |
| IdP | Usuarios activos o instancia | OD-04 |
| Observabilidad | Ingesta y retención | ADR-015 |
| Seguridad | Pentest, herramientas SCA/SAST | Cotización |
| Humano | Especialistas curriculares, panel de evaluación, asesoría legal | Etapa 0 |

**Costo por plan** = Σ (tokens por tarea × precio) para las tareas típicas de un plan + costo fijo prorrateado por plan activo. Se compara con el presupuesto de OD-09; el routing (07 §9.2) es la principal palanca.

## 12. Registro de deuda técnica (decisiones conscientes)

| ID | Deuda asumida | Motivo | Disparador de pago |
|---|---|---|---|
| TD-01 | Cola de trabajos propia en PostgreSQL | ADR-008 | Criterios de 07 §5 |
| TD-02 | Sin búsqueda de estudiantes por nombre | ADR-006 | Necesidad validada + revisión de seguridad |
| TD-03 | Sin coedición simultánea fluida | ADR-004 | Demanda institucional en piloto |
| TD-04 | Recuperación vectorial en PostgreSQL | ADR-002 | Incumplimiento de NFR-PERF-01 |
| TD-05 | Grafo con profundidad ≤ 3 | ADR-003 | Consultas validadas más profundas |
| TD-06 | Rate limiting sin almacén compartido dedicado | ADR-019 | Cuello de botella medido |
| TD-07 | Un solo proveedor de IA conectado en MVP | S26 Etapa 1 | Etapa 2 / BYOK |
| TD-08 | Matriz de egress provisional | ADR-017 | Validación legal |
| TD-09 | Sin sandbox | ADR-011 | Casos de uso de la Etapa 4 |

## 13. Decisiones pendientes
OD-08 (modelo de negocio), OD-09 (presupuesto por plan), OD-10 (equipo, nube, proveedores), OD-11 (piloto).

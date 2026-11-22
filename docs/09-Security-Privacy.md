# 09 — Arquitectura de seguridad, privacidad y modelo de amenazas

**Versión:** 0.1-draft · **Estado:** Draft — **no constituye asesoría legal** · **Fecha:** 2026-11-22
**Dependencias:** [04 §11](04-Software-Architecture.md), [06 §5–6](06-Data-Architecture.md), [07 §9–11](07-AI-Agentic-Architecture.md), ADR-006/010/012/017/020/022
**Referencias:** OWASP ASVS, OWASP API Security Top 10 (2023), OWASP Top 10 for LLM Applications (2025), NIST CSF 2.0, NIST AI RMF 1.0 — ediciones conocidas por el autor; confirmar vigentes.
**Decisiones pendientes:** OD-01, OD-03, OD-05, SPR-09 (validación legal)

## 1. Principios

- **Zero Trust:** cada solicitud y cada llamada entre componentes se autentica y autoriza; la red interna no otorga confianza.
- **Least Privilege:** roles de BD mínimos, scopes por herramienta, agentes con los permisos del docente solicitante y nunca más.
- **Defense in Depth:** PDP (ABAC) + RLS + bóveda separada + DLP + Egress Proxy.
- **Secure by Design / Privacy by Design:** grupo antes que individuo; minimización; datos sintéticos hasta la validación legal (SPR-09).
- **Fail-closed:** ante duda de autorización o de egress, se deniega.

## 2. Activos y fronteras

| Activo | Clase | Dónde vive | Impacto si se compromete |
|---|---|---|---|
| Identidad estudiantil | C4 | `vault` (AEAD) | Crítico |
| Contexto pedagógico de grupo | C2 | `mem`, `kg` privado | Alto |
| Planes y decisiones del docente | C1 | `pln`, `doc`, `mem` | Alto (autoría, autonomía) |
| Reglas curriculares | C0 | `cur` | Medio (integridad normativa) |
| Claves (KEK/DEK), secretos, BYOK | — | KMS, gestor de secretos | Crítico |
| Audit log y eventos de decisión | — | `iam`, `mem` | Alto (no repudio) |

Fronteras TB-1 … TB-8: [04 §11](04-Software-Architecture.md).

## 3. Data Flow Diagram

Diagrama con fronteras de confianza: [diagrams/dfd.md](diagrams/dfd.md). Flujos críticos: (F1) docente ↔ API; (F2) API ↔ BD; (F3) VaultService ↔ KMS; (F4) Context Assembler → AI Gateway → Egress Proxy → proveedor; (F5) supervisor → Tool Registry → servicios de dominio; (F6) worker → almacén de objetos; (F7) outbox → webhooks institucionales; (F8, Etapa 4) worker ↔ sandbox.

## 4. STRIDE por elemento

| Elemento | S (suplantación) | T (manipulación) | R (repudio) | I (divulgación) | D (denegación) | E (elevación) |
|---|---|---|---|---|---|---|
| Web App / API (TB-1/2) | Robo de sesión → OIDC, tokens cortos, MFA | Manipulación de payload → validación de esquema | Negar una aprobación → `DecisionEvent` + audit | IDOR/BOLA → PDP + RLS | Abuso de API → rate limit | Escalar rol → RBAC/ABAC, sin `tenant_id` del cliente |
| PostgreSQL (TB-3) | Credenciales robadas → identidad de carga de trabajo, TLS | Alterar aprobado → trigger INV-01 | Borrar eventos → append-only | Consultas sin tenant → RLS `FORCE` | Consultas costosas → timeouts, límites | `BYPASSRLS` → prohibido |
| Bóveda + KMS (TB-4) | — | Mover ciphertext → AAD | Acceso no auditado → audit obligatorio | Lectura masiva → solo `VaultService`, roster por grupo | KMS caído → degradación | Acceso de agentes → sin ruta |
| AI Gateway (TB-5) | Proveedor falso → allowlist en Egress Proxy, TLS | Salida maliciosa → validación de esquema | — | Fuga a proveedor → DLP + matriz de egress | Consumo de tokens → presupuestos | Prompt injection → contenido no confiable delimitado |
| Tool Registry / agentes (TB-6) | Agente actuando como otro → identidad del docente | Herramienta envenenada → contratos revisados | Acción sin rastro → `ToolInvocation` | Exfiltración vía herramienta → scopes, clase de dato máxima | Bucles de agente → presupuestos y pasos máximos | Excessive agency → allowlist, gates |
| Sandbox (TB-7, Etapa 4) | — | Escape → microVM/contenedor endurecido | — | Egress → allowlist | Abuso de cómputo → cuotas, TTL | Acceso a secretos → sin secretos |
| Tenant ↔ tenant (TB-8) | — | — | — | Fuga cruzada → RLS + pruebas adversariales | Vecino ruidoso → cuotas por tenant | — |

## 5. Threat Register

Probabilidad e impacto se expresan cualitativamente (Alta/Media/Baja) como juicio inicial a revisar en el primer ejercicio de modelado con el equipo; no son mediciones.

| ID | Amenaza | Referencia | Prob. | Impacto | Controles | Requisitos |
|---|---|---|---|---|---|---|
| T-01 | Prompt injection directa (instrucciones del usuario para saltar restricciones) | OWASP LLM01 | Alta | Medio | Restricciones del sistema fuera del alcance del usuario; validación de salida; ningún efecto sin servicio de aplicación | FR-AIO-07 |
| T-02 | Prompt injection indirecta (documento importado, salida de herramienta, página) | OWASP LLM01 | Alta | Alto | Contenido no confiable delimitado como datos; no eleva permisos ni activa herramientas | SPR-04 |
| T-03 | Divulgación de información sensible al proveedor | OWASP LLM02 | Media | Crítico | DLP, matriz de egress, minimización, sin identidad en contexto | FR-AIO-03, FR-STU-02 |
| T-04 | Tool poisoning (descripciones o salidas maliciosas de herramientas MCP) | OWASP LLM03/LLM01 | Media | Alto | Allowlist de servidores, contratos revisados, salidas como no confiables | FR-AGX-05, SPR-04 |
| T-05 | Excessive agency (agente con más permisos o autonomía de los necesarios) | OWASP LLM06 | Media | Alto | Allowlist por agente, scopes del docente, gates humanos | FR-AGX-02, FR-AGX-03 |
| T-06 | Manejo inseguro de la salida (salida usada como código, HTML o comando) | OWASP LLM05 | Media | Alto | Esquemas, saneamiento, render determinista | FR-AIO-07, EIR-03 |
| T-07 | Escalada de privilegios horizontal (BOLA/IDOR) | OWASP API1 | Media | Alto | PDP en cada recurso, RLS, `404` fuera del tenant | FR-IAM-02, SPR-01 |
| T-08 | Escalada vertical (función administrativa accesible) | OWASP API5 | Baja | Alto | RBAC por endpoint, MFA en roles administrativos | FR-IAM-03 |
| T-09 | Fuga entre tenants o grupos | — | Media | Crítico | RLS `FORCE`, ABAC, pruebas adversariales en CI | INV-05, INV-08, NFR-SEC-03 |
| T-10 | Exfiltración por agente o sandbox | OWASP LLM02 | Baja | Crítico | Egress allowlist, sin secretos, cuotas | SPR-05, FR-AGX-06 |
| T-11 | Reidentificación de estudiantes por combinación de atributos | — | Media | Alto | Agregación de grupo, sin atributos individuales en MVP, DLP | FR-STU-03, OD-05 |
| T-12 | Reidentificación por hash de nombres | — | Baja | Crítico | Sin hashes de nombre; `student_ref` aleatorio | FR-STU-01 |
| T-13 | Envenenamiento de memoria (hecho falso promovido) | OWASP LLM04 | Media | Medio | Solo `candidate` desde LLM; confirmación docente con evidencia | INV-03, INV-04 |
| T-14 | Debilidades de vectores/embeddings (fuga por similitud, cruce de tenants) | OWASP LLM08 | Media | Alto | Filtros de autorización en la consulta; embeddings sin PII | FR-MEM-06, DAT-04 |
| T-15 | Desinformación normativa (obligaciones MEP inventadas) | OWASP LLM09 | Alta | Alto | Reglas como datos con cita; `validation_incomplete`; revisión experta | FR-CUR-03, BR-02 |
| T-16 | Consumo ilimitado (costos o DoS por tokens) | OWASP LLM10, API4 | Media | Medio | Presupuestos, rate limiting | FR-AIO-06, FR-API-07 |
| T-17 | Fuga del prompt del sistema | OWASP LLM07 | Media | Bajo | Sin secretos en prompts; prompts no son control de seguridad | SPR-03 |
| T-18 | Robo de credenciales o tokens | OWASP API2 | Media | Alto | OIDC, tokens cortos, MFA/passkeys, revocación | FR-IAM-03, FR-IAM-06 |
| T-19 | SSRF vía URL de importación o herramienta | OWASP API7 | Media | Alto | Egress Proxy con allowlist; sin URLs arbitrarias en workers | SPR-05 |
| T-20 | Compromiso de la cadena de suministro (dependencia maliciosa) | OWASP LLM03 | Media | Alto | SBOM, versiones fijadas, SCA, revisión de dependencias nuevas | SPR-08 |
| T-21 | Alteración de contenido aprobado | — | Baja | Alto | Trigger INV-01, hash, auditoría | INV-01 |
| T-22 | Repudio de una decisión docente | — | Baja | Medio | `DecisionEvent` append-only, hash encadenado | FR-MEM-01, INV-07 |
| T-23 | Acceso institucional indebido a notas privadas | — | Media | Alto | ABAC: rol institucional ≠ acceso a lo privado; `Grant` explícito | FR-IAM-02, FR-IAM-04 |
| T-24 | PII en logs, trazas o fixtures | — | Media | Alto | Redacción en OTel, escáner en CI | NFR-PRV-01 |
| T-25 | Backups sin cifrar o restaurables por terceros | — | Baja | Crítico | Cifrado, acceso restringido, crypto-shredding | SPR-07 |
| T-26 | Webhooks falsificados o reproducidos | OWASP API10 | Baja | Medio | Firma HMAC, `event_id`, ventana de tiempo | FR-API-06 |

**Riesgos de la suite (S28) y su tratamiento:** R1 claims de autoría → FR-PLN-15, BR-10, OD-02 · R2 alteración de aprobado → INV-01, 08 R-04 · R3 sobrecolecta → FR-STU-03, minimización · R4 error normativo → FR-CUR-03, ADR-016 · R5 brecha digital → NFR-USA-01, piloto rural (11 §10) · R6 competencia local → benchmark (11 §10) · R7 complejidad agéntica → ADR-008/009/011 · R8 desplazamiento del pensamiento profesional → modo acompañado, TITL · R9 tecnología llamativa → gates pedagógicos (11 §9) · R10 dependencia del proveedor → ADR-007, NFR-PORT-01.

## 6. Modelo de autorización

- **RBAC (roles por tenant):** `teacher`, `coordinator`, `tenant_admin`, `auditor`. Un rol habilita **tipos** de acción.
- **ABAC (atributos):** propietario del recurso, grupo, estado (p. ej. `approved`), visibilidad (`private`/`shared`), propósito declarado, tenant activo. Ejemplos de reglas:
  - Leer un plan: `owner = actor` **o** existe `Grant` vigente para `actor` y propósito, **o** `visibility = shared` dentro del tenant y rol ≥ `coordinator`.
  - Aprobar una sección: `owner = actor` y `actor_type = teacher` (INV-02).
  - Leer la bóveda: rol `teacher` del grupo + propósito `display_roster` + auditoría.
- **ReBAC limitado:** `Grant` expresa la relación «compartido con» (FR-IAM-04).
- **RLS:** red de seguridad por tenant (SPR-01); no expresa reglas ABAC finas.
- **Agentes:** heredan la identidad del docente solicitante, restringida por la allowlist y los scopes de la herramienta; nunca tienen permisos propios sobre datos.
- **Revocación:** `authz_version` y TTL corto de decisiones (FR-IAM-06, 08 R-07).

## 7. Cifrado y gestión de claves

| Capa | Control |
|---|---|
| Tránsito | TLS ≥ 1.2 (1.3 preferido) en todos los saltos, incluida la BD (NFR-SEC-01) |
| Reposo | Cifrado de volúmenes, BD y objetos con claves del KMS |
| Aplicación (identidad) | AEAD con DEK por tenant envuelta por KEK en KMS/HSM; AAD de contexto; rotación de KEK por re-envoltura (ADR-006, SPR-02) |
| BYOK | Claves del usuario cifradas con una DEK del tenant; nunca en logs ni sandbox (FR-AIO-05) |
| Borrado | Crypto-shredding destruyendo la DEK (DAT-03) |

## 8. Gestión de secretos

Gestor de secretos dedicado (ADR-022); identidades de carga de trabajo en lugar de credenciales estáticas cuando la nube lo permita; rotación programada; escaneo de secretos en CI y en el historial del repositorio (SPR-03); los prompts no contienen secretos (T-17).

## 9. Audit logging

Eventos auditados (FR-IAM-05): autenticación y fallos; lecturas de la bóveda; exports; cambios de permisos, membresías y grants; eliminaciones; uso de herramientas por agentes; resolución de gates; decisiones de egress bloqueadas; acceso de soporte. Campos: actor, tipo de actor, acción, recurso, propósito, resultado, `trace_id`, hora, hash encadenado. **Sin PII** (NFR-PRV-01). Append-only (INV-07); copia periódica a almacenamiento inmutable; acceso de lectura restringido a `auditor`.

## 10. Controles específicos de IA y agentes

| Control | Implementación | Amenazas |
|---|---|---|
| Separación de instrucciones y datos | Contenido no confiable delimitado y etiquetado (07 §6) | T-01, T-02 |
| Validación de salida | JSON Schema, saneamiento, sin ejecución de salida | T-06 |
| Tool allowlisting | Por agente y tenant (07 §10) | T-04, T-05 |
| Scoped credentials | Tokens del docente con scopes de herramienta; sin credenciales de agente | T-05, T-07 |
| Policy enforcement | PDP en cada herramienta y recuperación | T-07, T-09 |
| Network egress filtering | Egress Proxy con allowlist (SPR-05) | T-10, T-19 |
| Sandbox isolation | Etapa 4 (ADR-011) | T-10 |
| DLP | 07 §9.4 | T-03, T-11 |
| Gates humanos | 07 §11 | T-05 |
| No diagnóstico | Políticas y pruebas adversarias (BR-07) | — |
| Evidencia no inventada | Validación y evaluación (BR-08) | T-15 |
| Sin acceso a bóveda | FR-STU-02 | T-03, T-12 |

**Mapeo NIST AI RMF:** *Govern* (ADR, gates, roles, revisión legal y pedagógica) · *Map* (casos de uso por tarea, clases de datos, 07 §3) · *Measure* (10 §6–7: groundedness, policy violation rate, human correction rate) · *Manage* (degradación, circuit breakers, respuesta a incidentes, retirada de modelos).

## 11. Respuesta a incidentes

1. **Preparación:** roles (responsable de incidente, técnico, legal, comunicación), contactos, runbooks por tipo (fuga de datos, compromiso de credenciales, salida dañina de IA, caída de proveedor). Ensayo de mesa antes del lanzamiento (SPR-06).
2. **Detección:** alertas de seguridad, anomalías de acceso a la bóveda, bloqueos de egress, reportes de docentes.
3. **Contención:** revocar tokens y grants, desactivar proveedor o herramienta, suspender agentes, bloquear egress.
4. **Erradicación y recuperación:** corregir, restaurar desde backups si aplica, rotar claves.
5. **Notificación:** plazos y destinatarios según la normativa aplicable — **pendiente de validación legal** (§15).
6. **Lecciones aprendidas:** actualización del threat register y de las pruebas.

## 12. Backup y recuperación ante desastre

- PITR de PostgreSQL y snapshots cifrados; versionado del almacén de objetos; respaldo de configuración de KMS y procedimiento de recuperación de claves.
- Objetivos RPO ≤ 15 min y RTO ≤ 4 h *(provisionales, NFR-REL-01)*; ejercicio de restauración antes del lanzamiento y periódico (SPR-07).
- La restauración respeta crypto-shredding: datos borrados por destrucción de DEK siguen irrecuperables.

## 13. Seguridad de la cadena de suministro

SBOM por build; versiones fijadas y lockfiles; SCA y SAST en CI; revisión de dependencias nuevas (licencia, mantenimiento, postura de seguridad); imágenes base mínimas y firmadas; secretos fuera del repositorio; revisión de modelos y adaptadores de IA como dependencias (SPR-08).

## 14. Evaluación preliminar de privacidad (DPIA/PIA)

> Preliminar y técnica. **Debe** completarla y validarla asesoría legal costarricense antes de tratar datos reales de menores (SPR-09).

| Aspecto | Evaluación preliminar |
|---|---|
| Finalidad | Apoyar al docente en la coelaboración de planeamientos y materiales para sus grupos |
| Titulares | Docentes (usuarios); estudiantes menores (no usuarios); personal institucional |
| Datos | Docente: identidad de cuenta, contenidos, decisiones. Estudiantes: en MVP solo existencia en el grupo (`student_ref`) y, opcionalmente, nombre en la bóveda para que el docente vea su roster; contexto de grupo agregado. Sin diagnósticos ni datos de salud |
| Necesidad y proporcionalidad | Nivel de grupo por defecto; perfiles individuales deshabilitados (FR-STU-03); nombres opcionales y solo en la bóveda |
| Base de legitimación | **Por determinar** con asesoría legal: rol del docente, de la institución y de la plataforma (responsable/encargado), consentimientos o mandato institucional (OD-01) |
| Transferencias a proveedores de IA | Solo clases permitidas por la matriz de egress; nunca C4; contratos y DPA por proveedor; residencia por decidir (OD-03) |
| Retención | Por definir (OD-03); caducidad por periodo lectivo; crypto-shredding |
| Derechos | Acceso, rectificación y eliminación mediante las funciones de memoria y export (FR-MEM-04, NFR-PORT-01); procedimiento formal por definir |
| Riesgos principales | T-03, T-09, T-11, T-12, T-13 |
| Riesgo residual | No evaluable hasta definir la base legal y los proveedores |

## 15. Registro de cumplimiento (pendiente de validación legal en Costa Rica)

| Ítem | Fuente | Qué hay que validar | Estado |
|---|---|---|---|
| Ley 8968 (protección de la persona frente al tratamiento de sus datos personales) y su reglamento | S23 | Bases de legitimación, datos de menores, inscripción de bases de datos ante PRODHAB si aplica, transferencias, derechos de titulares, notificación de incidentes | Pendiente |
| Ley 10238 | Citada por S23 | Alcance y aplicabilidad a esta actividad (contenido no verificado en este baseline) | Pendiente |
| Requisitos de PRODHAB | S23 | Obligaciones según la actividad real | Pendiente |
| Circular MEP DVM-AC-CIR-0003-2026 (autoría personal del planeamiento) | S15, S24 | Que UX, export y marketing reflejen coelaboración y no sustitución | Pendiente (OD-02) |
| Plantillas y orientaciones MEP 2026 | S05, S15 | Validación experta por asignatura | Pendiente |
| Centros privados y acreditación | S12, S24 | Requisitos por oferta acreditada | Pendiente |
| Contratos y DPA con proveedores de IA | S23 | Uso de datos, retención, residencia, subencargados | Pendiente |
| Política de privacidad, términos, DPA institucional, política de retención, incidentes, licencias de materiales, matriz responsable/encargado | S23 | Redacción y aprobación | Pendiente |
| Licencias de materiales de terceros (p. ej. libro TEC) | S13, S28 | Uso permitido | Pendiente (OD-13) |

**No se afirma** cumplimiento de ninguna norma. No se promete «cero filtraciones» ni ausencia de demandas (S23).

## 16. Mapeo con marcos

| Marco | Uso en este baseline |
|---|---|
| OWASP ASVS (nivel 2 objetivo) | Lista de verificación de autenticación, sesión, control de acceso, validación, criptografía, logging (NFR-SEC-02) |
| OWASP API Security Top 10 | T-07, T-08, T-16, T-18, T-19, T-26; pruebas de 10 §5 |
| OWASP Top 10 for LLM Applications | T-01 … T-06, T-13 … T-17, T-20 |
| NIST CSF 2.0 | Govern (ADR, roles), Identify (§2), Protect (§6–8, 13), Detect (§9, alertas), Respond (§11), Recover (§12) |
| NIST AI RMF | §10 |

## 17. Decisiones pendientes
OD-01 (roles de tratamiento), OD-03 (retención y residencia), OD-05 (perfiles individuales y agregación mínima), validación legal de §14–15 (SPR-09).

# Seguridad y privacidad: prioridad transversal

## Decisiones fundamentales
Separar **bóveda de identidad cifrada** de **perfil pedagógico privado seudonimizado** y de **grafo curricular público**. ID aleatorio por estudiante; propiedad y autorización asociadas a tenant/cuenta, cifrado autenticado con claves administradas por KMS, control de acceso RBAC/ABAC/RLS y auditoría. Un hash no recupera nombres ni reemplaza la autorización.

## Políticas de IA y conectores
Filtrar PII y atributos de reidentificación antes de envío al proveedor; registrar qué salió, con qué finalidad, bajo qué permiso y qué proveedor. No permitir que herramientas MCP o agentes consulten directamente la bóveda ni que un contenido no confiable eleve permisos. BYOK no legaliza tratamiento automáticamente. Proteger logs, embeddings, backups, reportes, exportaciones, memoria y sandbox.

## Gobierno legal
Documentos necesarios: Política de Privacidad, Términos y Condiciones, DPA institucional y de proveedores, avisos/consentimientos pertinentes, política de retención, respuesta a incidentes, acuerdo de licencias de materiales y matriz de roles responsable/encargado. Revisar Ley 8968, Ley 10238 y requisitos de PRODHAB según actividad real; asesoría legal costarricense antes del tratamiento de datos reales de menores. No prometer «no recibir demandas» ni «cero filtraciones».

## Controles verificables mínimos
MFA/passkeys, rate limiting, cifrado de transporte y reposo, secrets manager y KMS, aislamiento por tenant, pruebas contra IDOR, auditoría, backups restaurables, WAF según superficie, parches, SAST/SCA, revisión de dependencias, pentest y plan de incidentes. Aplicar OWASP ASVS y guías de aplicaciones LLM/agentes; incidentes con responsables y escalamiento.

## Política institucional
Una institución debe elegir proveedores permitidos y políticas de conservación, sin comprometer los derechos de los titulares ni la seguridad mínima obligatoria para todos los planes. El docente tiene control pedagógico, no permisos administrativos para extraer expedientes institucionales.

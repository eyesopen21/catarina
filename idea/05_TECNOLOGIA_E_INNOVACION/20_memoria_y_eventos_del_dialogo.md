# Memoria conversacional y procedencia como estructura de primer orden

## Qué conservar
**Conversación autorizada:** mensajes, intención de cambio, objetivo, contexto declarado, vínculos con bloques, versiones y decisiones. **Fuente de verdad:** eventos de aprobación/cambio y documentos versionados. **Derivados:** resúmenes recuperables, embeddings sin PII, clasificaciones y preferencias candidatas. Las memorias derivadas deben tener revisión, fecha de caducidad, alcance y opción de rechazo.

## Contrato conceptual de evento
`event_id, tenant_id, teacher_id, plan_id, block_id, event_type, prior_version, new_version, decision_source, teacher_confirmation, rationale, timestamp, provenance_ref, pii_classification`. Distinguir `assistant_proposal` de `teacher_approval` de manera verificable. La aprobación deja firma lógica, no un nombre reconstruido por IA.

## Recuperación inteligente
Ante «hacé algo parecido al proyecto del tren», recuperar **solo** material propio autorizado del docente/grupo, fuente, objetivos y observaciones. Mostrar referencias en el editor («basado en actividad aprobada del mes de mayo, grupo 4-A»). Nunca fundir información de estudiantes de distintos centros para producir un perfil público.

## Política de memoria
Aprobación explícita para preferencias persistentes. Memoria puntual por grupo/periodo no implica preferencia universal. Permitir borrar/rectificar y invalidar embeddings o resúmenes relacionados. Caducidad al cerrar año/grupo según acuerdos. Permisos del centro no implican acceso libre a notas personales del docente.

## Pruebas de integridad
Interrupción de sesión, cambio de proveedor IA, mezcla de grupos, contradicciones en memoria y recuperación de plan antiguo. Asegurar que cada paso respete estados aprobados, que se pueda explicar por qué sugirió algo y que la persona docente pueda corregir un recuerdo incorrecto.

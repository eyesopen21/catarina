# Protocolo de coelaboración docente–plataforma (núcleo funcional)

## No es «introducir prompt → producir Word»

Un planeamiento se negocia en iteraciones. El sistema necesita comprender la intención docente, la progresión curricular y el estado de aprobación de cada componente. La unidad de trabajo es una **versión de planeamiento estructurado con conversación y decisiones vinculadas**.

## Ciclo canónico

1. **Entrar desde el docente:** aprendizaje, contenido, tiempo, asignatura, grupo y propuesta creativa. Recuperar contexto previo autorizado y preguntar solo lo indispensable.
2. **Fundamentar:** localizar fuentes MEP y versión, inferir restricciones por grado/asignatura, justificar metodología sin fingir oficialidad de preferencias.
3. **Idear en colaboración:** explorar una propuesta inicial y alternativas si se piden; explicar en prosa la dinámica real, roles, consignas, preguntas, materiales, tiempo y evidencias.
4. **Construir por bloques:** registrar la actividad como entidad editable, asociar aprendizaje(s), fase metodológica, recurso/anexo e indicador(es).
5. **Revisión diferencial:** ante «dejá A y C, modificá B», congelar A/C; sugerir reemplazo de B con comparación original/propuesta. No regenerar texto aprobado ni reordenar anexos sin alerta.
6. **Coherencia descendente:** un cambio en B puede afectar indicador, hoja, tiempo o evaluación; ofrecer una propuesta de impactos y obtener aprobación separada.
7. **Aprobación explícita:** bloquear componentes con sello de versión, autor y fecha; permitir reabrirlos de forma intencional.
8. **Consolidación:** producir el planeamiento completo en formato correcto y anexos listos; verificar referencias una sola vez cuando corresponde.
9. **Aplicación y reflexión:** permitir registrar qué se hizo, observaciones verificadas, barreras y sugerencias para la próxima vez. No inventar desempeño de estudiantes.
10. **Memoria contextual:** crear propuestas de aprendizaje de preferencias por docente/grupo, que se aceptan, editan o rechazan y mantienen su procedencia.

## Máquina de estados mínima

`idea → borrador → en_revision → parcialmente_aprobado → aprobado → exportado → implementado → reflexionado`.

Cada bloque de contenido: `draft | proposed | approved | reopened | superseded`. Los cambios deben ser eventos del tipo `create_block`, `propose_patch`, `accept_patch`, `reject_patch`, `approve_block`, `reopen_block`, `attach_evidence`, `record_reflection`, `request_export`.

## Ejemplo de instrucción realista

«Me gusta el juego de inicio, dejalo igual. El desarrollo es muy escrito; quiero una dinámica cooperativa. El cierre queda intacto». Respuesta esperada: resumen de bloques congelados, versión original del desarrollo, nueva propuesta de dinámica con sustento, impactos en anexos/indicadores y controles para aprobar. Respuesta incorrecta: reescribir todo el plan o cambiar automáticamente el cierre.

## Modelo de memoria conversacional

Guardar **intenciones y decisiones** (propósito, alcance, bloque afectado, propuesta, autor, motivo, contexto, versión), no solo resúmenes del chat. La conversación completa puede conservarse según política de retención; los resúmenes son índices, no fuente de verdad. Incorporar recuperación por unidad, grado, asignatura, grupo, tema, actividad, material y aprendizaje. Mostrar «por qué recordé esto».

## Definición de listo

El sistema puede repetir el ciclo anterior manteniendo más de una sesión, tras cambiar proveedor de IA, sin perder bloqueos ni anexos y sin exponer datos estudiantiles. El docente puede inspeccionar historial y revertir una propuesta.

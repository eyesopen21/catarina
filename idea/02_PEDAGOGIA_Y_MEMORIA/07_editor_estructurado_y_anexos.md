# Planeamiento como documento vivo (no como salida de texto plano)

## Modelo de documento

El plan es una estructura de bloques referenciables: `objetivo/aprendizaje`, `contenido`, `metodologia`, `estrategia`, `actividad`, `pregunta`, `anexo`, `indicador`, `instrumento`, `tiempo`, `fuente`. Cada actividad tiene su identificador estable y depende de objetivos, indicadores y materiales concretos. Las referencias entre bloques permiten actualizar elementos afectados, no el documento completo.

## Acciones esenciales del editor

- Crear desde solicitud corta o plantilla; importar original con revisión humana.
- Editar por bloque, comparar original/mejorado, aprobar, rechazar, reabrir y revertir.
- Mantener fragmentos aprobados congelados y recalcular dependencias como propuesta, nunca como reemplazo silencioso.
- «Mostrar impacto»: cambiar desarrollo afecta tiempo, Anexo 2 e Indicador 3; permitir escoger cuáles actualizar.
- Numerar anexos por orden de primera mención, mantener identidad estable aunque se reordenen actividades y mostrar un aviso cuando la referencia se vuelva inconsistente.
- Renderizar material **desde la perspectiva del estudiante**, no como instrucciones vagas. Mantener respuestas/solucionario docentes separados del material entregable.
- Exportar DOCX/PDF/impresión solo cuando se solicite, conservando ediciones previas.

## Reglas de redacción

La estrategia describe secuencia y mediación: acción de estudiantes y docente, consigna textual, agrupamiento, materiales, preguntas, posibles respuestas/andamiajes, tiempo estimado, evidencia y conexión con aprendizaje. Debe adecuarse al programa y contexto. No usar «realizarán una actividad lúdica» como paso completo.

## Calidad de anexos

Un anexo válido debe poder usarse en clase: instrucciones autónomas adecuadas al grado, ejemplos cuando hagan falta, espacio para responder, legibilidad, imágenes propias/permitidas y formato de impresión. La etiqueta «Anexo 1» pertenece al planeamiento; el encabezado visible debe ser «Descubrimos palabras escondidas», «¿Dónde encontramos energía?» u otro nombre natural.

## Semántica de aprobación

Se recomienda almacenar versiones y hashes de contenido para detectar cambios no autorizados, pero **no utilizar el hash como sustituto de permisos**. Cada versión aprobada guarda autor, timestamp, fuente y alcance. El motor rechaza por defecto un `patch` que toque bloque aprobado sin `reopen` explícito.

## Pruebas de aceptación

Aprobá inicio y cierre, modificá desarrollo: ambos permanecen byte-a-byte idénticos en el documento estructurado; el diff y la trazabilidad reflejan solo cambios autorizados; anexos e indicadores afectados se muestran como propuestas pendientes. Exportar no debe generar referencias duplicadas ni hojas incompletas.

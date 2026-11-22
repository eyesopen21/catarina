# Agentes personales y groupbots subordinados a la práctica docente

## Diseño
**Agente coordinador personal:** asistente lógico del profesor, agenda tareas, busca documentos autorizados y pide aprobaciones. **Groupbot:** es una vista/agente contextual de un grupo, sin credenciales ni acceso irrestricto a identidad de estudiantes. **Agentes especializados:** curricular, creativo, documental, evaluación y revisión; se invocan solo para las tareas que lo requieren. **Institution bot:** permisos de centro para tareas institucionales, sin acceso automático a toda la memoria privada docente.

## Ejemplo de workflow durable
El docente solicita «revisá los anexos pendientes del planeamiento mensual». El coordinador abre el plan, consulta los bloques autorizados, verifica links a anexos, genera borradores donde hay vacíos, registra cambios propuestos y espera la aprobación del docente. No publica ni sustituye documentos aprobados. El motor reintenta fallos y conserva estado incluso si cierra sesión.

## Sandboxes/microVM
No mantener una VM 24/7 por profesor. Crear entorno aislado bajo demanda para código, edición masiva de documentos o navegación, con TTL, cuota CPU/memoria, red en lista permitida y volúmenes temporales. Al terminar guardar artefactos aprobados en almacenamiento versionado y destruir el entorno. No introducir tokens de proveedor ni claves de estudiante en la microVM.

## Independencia tecnológica
Gateway de API/MCP; A2A opcional entre sistemas de agentes bajo identidades y permisos fuertes. Temporal/LangGraph/Firecracker se proponen como alternativas a verificar en piloto, no dogmas arquitectónicos. Modelo flagship no se usa para tareas deterministas de validación documental.

## Límites de autonomía
Automático: preparar borradores, buscar fuentes, proponer actividades. Con autorización explícita: sobrescribir documentos aprobados, compartir contenidos, programar comunicaciones. Privilegio especial: exportar registros estudiantiles, revelar identidades, cambiar permisos o eliminar datos. Acciones sensibles prohibidas sin ruta legal, roles adecuados y trazabilidad.

# ADR-017: Ensamblaje de contexto, DLP y control de egress en el AI Gateway

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto, con asesoría legal para la matriz de egress
- **Relacionado:** [07 §6, §9](../07-AI-Agentic-Architecture.md) · FR-AIO-02, FR-AIO-03, FR-AIO-07, FR-MEM-05, FR-PLN-13, BR-01, BR-07, SPR-04

## Context
S06: recuperar solo currículo y versión, preferencias pertinentes, contexto del grupo, partes aprobadas y recursos; no inyectar conversaciones enteras ni expedientes. S23: filtrar PII y atributos reidentificantes antes de enviar al proveedor y registrar qué salió, con qué finalidad y bajo qué permiso. S22: con datos de estudiantes, si no hay garantías del proveedor, ejecución local o autorizada, o no transferir.

## Decision Drivers
- Minimización y mínimo privilegio.
- Explicabilidad («por qué recordé esto», FR-MEM-05).
- Fallar cerrado ante duda (FR-AIO-03).
- Contenido no confiable separado de instrucciones (SPR-04).

## Considered Options
1. **Pipeline determinista**: autorizar → recuperar candidatos → filtrar vigencia y estado → ordenar por relevancia → minimizar → ajustar a presupuesto → DLP y egress → enviar; con manifiesto persistido.
   - Pros: cada etapa es testeable; el manifiesto permite explicar y auditar.
   - Contras: latencia adicional y falsos positivos de DLP.
2. **Pasar el historial completo al modelo.**
   - Pros: simple.
   - Contras: incumple la minimización de S06; costo y riesgo de fuga.
3. **Dejar que el modelo consulte la BD con herramientas.**
   - Pros: flexible.
   - Contras: incumple FR-STU-02 e INV-08.

## Decision
**Propuesta:** opción 1, con la matriz de egress de 07 §9 (clase de dato × nivel de proveedor). Los valores de la matriz son **provisionales** hasta la validación legal (SPR-09).

## Consequences
- Positivas: contexto explicable; el LLM nunca accede directamente a almacenes.
- Negativas: los falsos positivos de DLP pueden reducir utilidad → se miden con *Human Correction Rate* y tasa de bloqueo.

## Risks
- Reidentificación por combinación de atributos en grupos pequeños → reglas de agregación mínima (OD-05).

## Revisit Triggers
Con evidencia del piloto y tras la asesoría legal.

# ADR-015: Observabilidad — OpenTelemetry + Prometheus/Grafana sin PII

- **Status:** Proposed
- **Date:** 2026-11-22
- **Deciders:** pendiente — propietario del producto
- **Relacionado:** [11 §8](../11-Roadmap-MVP.md) · NFR-OBS-01, NFR-PRV-01, NFR-REL-02, FR-IAM-05

## Context
Se necesitan trazas de extremo a extremo (API → dominio → gateway → proveedor), SLO y control de costos de IA, sin filtrar datos de menores a la telemetría (S02, S23: proteger historiales, trazas y logs).

## Decision Drivers
- Estándar abierto e independiente del backend de observabilidad.
- Telemetría sin PII (NFR-PRV-01).
- Costo de tokens visible por tenant (NFR-OBS-01).

## Considered Options
1. **OpenTelemetry** (SDK + Collector) con exportación a Prometheus y Grafana, o a un backend gestionado compatible.
   - Pros: estándar abierto; el Collector permite redactar y filtrar atributos antes de exportar.
   - Contras: instrumentación inicial y pipeline que mantener.
2. **Solo logs de aplicación.**
   - Pros: simple.
   - Contras: sin trazas ni SLO.
3. **APM propietario con agente.**
   - Pros: funciones listas.
   - Contras: dependencia del proveedor; los agentes automáticos pueden capturar cuerpos de solicitudes con PII.

## Decision
**Propuesta:** opción 1, con listas de atributos permitidos, procesadores de redacción en el Collector, sin contenido de prompts ni nombres, y escaneo de PII en CI (NFR-PRV-01).

## Consequences
- Positivas: portabilidad y control de lo que sale a la telemetría.
- Negativas: esfuerzo de instrumentación.

## Risks
- Atributos con PII añadidos por error → escáner en CI y revisión de código.

## Revisit Triggers
Elección del backend según costo y operación.

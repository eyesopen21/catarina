# Diagramas (Mermaid)

Todos los diagramas son Mermaid editable embebido en Markdown y representan solo elementos definidos en las especificaciones.

| Tipo | Diagrama | Documento fuente |
|---|---|---|
| C4 L1 | [c4-l1-context.md](c4-l1-context.md) | 04 §3 |
| C4 L2 | [c4-l2-containers.md](c4-l2-containers.md) | 04 §4 |
| C4 L3 | [c4-l3-core-api.md](c4-l3-core-api.md), [c4-l3-ai-agents.md](c4-l3-ai-agents.md) | 04 §6, 07 |
| Deployment | [deployment.md](deployment.md) | 04 §10 |
| DFD + trust boundaries | [dfd.md](dfd.md) | 04 §11, 09 §3 |
| ERD | [erd-core.md](erd-core.md), [erd-memory-graph-agents.md](erd-memory-graph-agents.md) | 06 §2–3 |
| State machines | [state-plan.md](state-plan.md), [state-plan-section.md](state-plan-section.md), [state-task.md](state-task.md), [state-memory-fact.md](state-memory-fact.md) | 03 §3, 07 §4, 03 §8 |
| Sequence | [seq-coauthoring-patch.md](seq-coauthoring-patch.md), [seq-approval-race.md](seq-approval-race.md), [seq-outbox-delivery.md](seq-outbox-delivery.md), [seq-context-assembly.md](seq-context-assembly.md) | 03, 07, 08 |
| Dependencias de entrega | [roadmap-dependencies.md](roadmap-dependencies.md), [wbs-dependencies.md](wbs-dependencies.md) | 11 §4, 13 §4–5 |

Los diagramas C4 usan `flowchart` con la notación C4 en las etiquetas (persona, sistema, contenedor, componente) porque la sintaxis C4 nativa de Mermaid es experimental.

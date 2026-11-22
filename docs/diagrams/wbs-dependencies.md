# Dependencias del WBS (fases y carriles paralelos)

Fuente: [13 §4–5](../13-WBS-Agentes.md). Cada subgrafo es una fase; dentro de una fase, los paquetes sin flecha entre sí se ejecutan en paralelo. Los rombos son gates humanos.

```mermaid
flowchart LR
  subgraph F0["F0 Preparación y contratos"]
    WP00["WP-00 Etapa 0 (humanos)"]
    WP01["WP-01 Esqueleto y reglas de dependencias"]
    WP02["WP-02 Contratos v1 + mock"]
    WP03["WP-03 Harness de pruebas"]
    WP04["WP-04 Escenarios G01–G10"]
  end
  GF0{"G-F0"}

  subgraph F1["F1 Fundaciones"]
    WP10["WP-10 IaC y CI/CD"]
    WP11["WP-11 OIDC y tenants"]
    WP12["WP-12 PDP y RLS"]
    WP13["WP-13 Bóveda y roster"]
    WP14["WP-14 Audit log"]
    WP15["WP-15 Kernel outbox/cola"]
    WP16["WP-16 Observabilidad"]
    WP17["WP-17 Motor curricular"]
    WP18["WP-18 Reglas 4 asignaturas"]
    WP19["WP-19 Shell web"]
  end
  GF1{"G-F1"}

  subgraph F2["F2 Núcleo pedagógico sin IA"]
    WP20["WP-20 Plan y versiones"]
    WP21["WP-21 Patch y aprobación"]
    WP22["WP-22 Impacto"]
    WP23["WP-23 Validador pedagógico"]
    WP24["WP-24 Render y export"]
    WP25["WP-25 Log de decisiones"]
    WP26["WP-26 Grupos y memoria"]
    WP27["WP-27 Editor web"]
  end
  GF2{"G-F2"}

  subgraph F3["F3 IA y contexto"]
    WP30["WP-30 AI Gateway"]
    WP31["WP-31 DLP y egress"]
    WP32["WP-32 Presupuestos"]
    WP33["WP-33 Grafo"]
    WP34["WP-34 Contexto"]
    WP35["WP-35 Supervisor y gates"]
    WP36["WP-36 Prompts y evals"]
    WP37["WP-37 UI de propuestas"]
  end
  GF3{"G-F3"}

  subgraph F4["F4 Integración y piloto"]
    WP40["WP-40 E2E G01–G10"]
    WP41["WP-41 Seguridad"]
    WP42["WP-42 Carga y DR"]
    WP43["WP-43 Evaluación humana"]
    WP44["WP-44 Cierre legal"]
    WP45["WP-45 Operación del piloto"]
  end
  GMVP{"G-MVP"}

  WP01 --> WP02
  WP01 --> WP03
  WP02 --> WP04
  WP00 --> GF0
  WP02 --> GF0
  WP03 --> GF0
  WP04 --> GF0

  GF0 --> WP10
  GF0 --> WP11
  GF0 --> WP15
  GF0 --> WP17
  GF0 --> WP19
  WP11 --> WP12
  WP11 --> WP13
  WP12 --> WP14
  WP10 --> WP16
  WP17 --> WP18
  WP12 --> GF1
  WP13 --> GF1
  WP14 --> GF1
  WP15 --> GF1
  WP16 --> GF1
  WP18 --> GF1

  GF1 --> WP20
  GF1 --> WP25
  WP20 --> WP21
  WP20 --> WP22
  WP20 --> WP23
  WP20 --> WP24
  WP25 --> WP26
  WP19 --> WP27
  WP21 --> GF2
  WP22 --> GF2
  WP23 --> GF2
  WP24 --> GF2
  WP26 --> GF2
  WP27 --> GF2

  GF1 --> WP30
  WP26 --> WP33
  WP30 --> WP31
  WP30 --> WP32
  WP30 --> WP34
  WP33 --> WP34
  GF2 --> WP34
  WP34 --> WP35
  WP31 --> WP35
  WP35 --> WP36
  WP35 --> WP37
  WP36 --> GF3
  WP37 --> GF3
  WP32 --> GF3

  GF3 --> WP40
  WP35 --> WP41
  WP40 --> WP42
  WP40 --> WP43
  WP00 --> WP44
  WP24 --> WP44
  WP31 --> WP44
  WP16 --> WP45
  WP32 --> WP45
  WP40 --> GMVP
  WP41 --> GMVP
  WP42 --> GMVP
  WP43 --> GMVP
  WP44 --> GMVP
  WP45 --> GMVP
```

Las olas posteriores al MVP (WP-50 … WP-70) siguen la tabla de 13 §5.6 y empiezan después de G-MVP; no se dibujan aquí.

WP-30 (AI Gateway) puede empezar al cerrar G-F1, en paralelo con todo F2; solo WP-34 espera a G-F2, porque necesita el plan y la memoria terminados.

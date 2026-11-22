# C4 L3 — Componentes de dominio (API / Worker)

Fuente: [04 §5–6](../04-Software-Architecture.md). Las flechas respetan la matriz de dependencias de 04 §5.2; las líneas discontinuas son eventos vía outbox.

```mermaid
flowchart LR
  apigw["CMP-APIGW<br/>API layer"]

  subgraph IAM["BC-IAM"]
    authn["CMP-IAM-AUTHN"]
    authz["CMP-IAM-AUTHZ<br/>PDP"]
    ten["CMP-IAM-TEN"]
    vault["CMP-IAM-VAULT"]
    audit["CMP-IAM-AUDIT"]
  end

  subgraph CUR["BC-CUR"]
    src["CMP-CUR-SRC"]
    rule["CMP-CUR-RULE"]
  end

  subgraph PLN["BC-PLN"]
    plan["CMP-PLN-DOC"]
    patch["CMP-PLN-PATCH"]
    appr["CMP-PLN-APPR"]
    impact["CMP-PLN-IMPACT"]
    val["CMP-PLN-VAL"]
    anx["CMP-PLN-ANX"]
  end

  subgraph DOC["BC-DOC"]
    ver["CMP-DOC-VER"]
    rend["CMP-DOC-REND"]
  end

  subgraph MEM["BC-MEM"]
    evt["CMP-MEM-EVT"]
    fact["CMP-MEM-FACT"]
    kgraph["CMP-MEM-GRAPH"]
  end

  subgraph PLT["Plataforma"]
    outbox["CMP-PLT-OUTBOX"]
    wrk["CMP-PLT-WORKER"]
  end

  apigw --> authn
  apigw --> authz
  apigw --> plan
  apigw --> fact
  apigw --> rule
  plan --> patch
  plan --> appr
  patch --> impact
  plan --> val
  val --> rule
  val --> anx
  patch --> ver
  appr --> ver
  appr --> evt
  patch --> evt
  plan --> authz
  fact --> authz
  rule --> src
  vault --> audit
  wrk --> rend
  rend --> ver
  evt -.->|"OutboxEvent"| outbox
  outbox -.->|"PatchAccepted, SectionApproved"| kgraph
  outbox -.->|"MemoryFactConfirmed"| kgraph
  outbox -.->|"CurriculumVersionPublished"| kgraph
```

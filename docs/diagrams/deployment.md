# Deployment View (prod)

Fuente: [04 §10](../04-Software-Architecture.md). Región única inicial (residencia: OD-03). Runtime de contenedores gestionado; sin Kubernetes en el MVP.

```mermaid
flowchart TB
  user["Navegador del docente"]

  subgraph cloud["Región cloud (por decidir, OD-03)"]
    subgraph public["Subred pública"]
      lb["Load balancer + WAF<br/>TLS"]
    end
    subgraph app["Subred privada de aplicación"]
      api1["api réplica 1"]
      api2["api réplica 2"]
      wk["worker (escala por cola)"]
      egress["Egress Proxy<br/>allowlist"]
      otel["OTel Collector"]
    end
    subgraph data["Subred privada de datos"]
      pg[("PostgreSQL gestionado<br/>PITR, réplica opcional")]
      s3[("Object Storage<br/>versionado, SSE-KMS")]
    end
    kms["KMS / Secrets"]
    mon["Prometheus / Grafana"]
  end

  idp["IdP OIDC"]
  llm["Proveedores de IA"]

  user --> lb
  lb --> api1
  lb --> api2
  api1 --> pg
  api2 --> pg
  wk --> pg
  wk --> s3
  api1 --> s3
  api1 --> kms
  wk --> kms
  api1 --> egress
  wk --> egress
  egress --> llm
  api1 --> idp
  api1 --> otel
  wk --> otel
  otel --> mon
```

Entornos: `dev` (local, sintético), `staging` (sintético, dimensionado para carga), `prod` (único con datos reales, tras SPR-09).

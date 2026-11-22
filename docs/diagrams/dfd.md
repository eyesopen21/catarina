# Data Flow Diagram con trust boundaries

Fuente: [04 §11](../04-Software-Architecture.md), [09 §3–4](../09-Security-Privacy.md). Cada subgrafo es una zona de confianza; los flujos F1–F8 cruzan las fronteras TB-1 a TB-7.

```mermaid
flowchart LR
  subgraph Z0["Internet (no confiable)"]
    browser["Docente / navegador"]
  end

  subgraph Z1["Zona de aplicación"]
    api["API + PDP"]
    ctx["Context Assembler"]
    gw["AI Gateway + DLP"]
    sup["Supervisor + Tool Registry"]
    vaultSvc["VaultService"]
    wk["Worker"]
  end

  subgraph Z2["Zona de datos"]
    pln[("pln / doc / mem / kg / cur")]
    vault[("vault: identidad AEAD")]
    obj[("Object Storage")]
  end

  subgraph Z3["Servicios de claves"]
    kms["KMS / HSM"]
  end

  subgraph Z4["Terceros"]
    llm["Proveedor de IA"]
    hook["Webhook institucional"]
  end

  subgraph Z5["Sandbox (Etapa 4)"]
    sbx["Entorno efímero"]
  end

  browser -->|"F1 TB-1/TB-2: HTTPS, token OIDC"| api
  api -->|"F2 TB-3: SQL con tenant, RLS"| pln
  vaultSvc -->|"F2 TB-3: rol vault_rw"| vault
  vaultSvc -->|"F3 TB-4: unwrap DEK"| kms
  api --> vaultSvc
  api --> sup
  sup -->|"F5 TB-6: herramienta con scopes del docente"| api
  sup --> ctx
  ctx -->|"lectura autorizada, sin identidad"| pln
  ctx --> gw
  gw -->|"F4 TB-5: solo clases permitidas, vía Egress Proxy"| llm
  wk -->|"F6"| obj
  wk -->|"F7: eventos sin PII, firmados"| hook
  wk -.->|"F8 TB-7: sin secretos ni datos de estudiantes"| sbx
```

Reglas visibles en el diagrama: ninguna flecha conecta `vault` con el gateway, el supervisor ni el sandbox; el proveedor de IA solo recibe datos desde el gateway.

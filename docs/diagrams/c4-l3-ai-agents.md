# C4 L3 — AI Orchestration y Agent Execution

Fuente: [04 §6](../04-Software-Architecture.md), [07](../07-AI-Agentic-Architecture.md). El LLM no tiene ruta a almacenes: solo recibe el contexto ensamblado y su salida vuelve como propuesta.

```mermaid
flowchart LR
  subgraph AGX["BC-AGX"]
    sup["CMP-AGX-SUP<br/>Supervisor / Workflow"]
    task["CMP-AGX-TASK<br/>Task Store & Queue"]
    tools["CMP-AGX-TOOLS<br/>Tool Registry / MCP"]
    sbx["CMP-AGX-SBX<br/>Sandbox Manager (Etapa 4)"]
  end

  subgraph AIO["BC-AIO"]
    ctx["CMP-AIO-CTX<br/>Context Assembler"]
    gw["CMP-AIO-GW<br/>AI Gateway"]
    router["CMP-AIO-ROUTER"]
    dlp["CMP-AIO-DLP"]
    bud["CMP-AIO-BUD"]
  end

  plnRead["BC-PLN<br/>ContextSource (lectura)"]
  plnCmd["BC-PLN<br/>Comandos: propose_patch"]
  memRet["BC-MEM<br/>MemoryRetrieval / GraphAccessService"]
  curRead["BC-CUR<br/>CurriculumQuery"]
  authz["CMP-IAM-AUTHZ"]
  egress["Egress Proxy"]
  llm["Proveedores de IA"]

  task --> sup
  sup --> ctx
  sup --> tools
  sup -.-> sbx
  ctx --> authz
  ctx --> plnRead
  ctx --> memRet
  ctx --> curRead
  sup --> gw
  gw --> bud
  gw --> router
  gw --> dlp
  router --> egress
  egress --> llm
  tools --> authz
  tools --> plnCmd
  tools --> memRet
```

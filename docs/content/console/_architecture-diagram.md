```mermaid
graph TB
    User["User"]
    GitHub["GitHub OAuth"]
    Backend["Console Backend<br/>:8080"]
    Browser["Browser"]
    MCP["MCP Bridge"]
    K8s["Kubernetes<br/>Clusters"]
    Agent["kc-agent<br/>:8585"]
    CLI["AI Coding Agent"]
    OpsStdio["kubestellar-ops<br/>MCP (stdio)"]
    DeployStdio["kubestellar-deploy<br/>MCP (stdio)"]
    AI["AI Provider API"]

    User -- invokes --> CLI
    Browser -- OAuth flow --> Backend
    Browser -- authorize --> GitHub
    GitHub -- access token --> Backend
    Backend -- session JWT --> Browser
    Backend -- REST / WS --> Browser
    Browser -- WebSocket --> Agent
    Backend -- MCP/HTTP --> MCP
    MCP -- K8s API --> K8s
    Agent -- kubectl --> K8s
    OpsStdio -- K8s API --> K8s
    DeployStdio -- K8s API --> K8s
    CLI -- MCP stdio --> OpsStdio
    CLI -- MCP stdio --> DeployStdio
    CLI -- MCP protocol --> Agent
    Backend -- AI completions --> AI
    CLI -- AI prompts --> AI
```

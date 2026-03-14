```mermaid
graph TB
    GitHub["GitHub OAuth"]
    Backend["Console Backend :8080"]
    Browser["User Browser"]
    MCP["MCP Bridge"]
    K8s["Kubernetes Clusters"]
    Agent["kc-agent :8585"]
    CLI["Claude Code CLI"]
    API["GPT API"]

    Browser -- "OAuth flow" --> Backend
    Browser -- "authorize" --> GitHub
    GitHub -- "access token" --> Backend
    Backend -- "session JWT" --> Browser
    Backend -- "REST / WebSocket" --> Browser
    Browser -- "WebSocket" --> Agent
    Backend -- "kubeconfig" --> MCP
    MCP -- "kubeconfig" --> K8s
    Agent -- "kubectl" --> K8s
    Agent -- "MCP protocol" --> CLI
    CLI -- "kubestellar-ops" --> K8s
    API -- "read-only queries" --> Backend
```

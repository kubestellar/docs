# Dapr Integration with KubeStellar Console

## Overview
Dapr (Distributed Application Runtime) is a CNCF Graduated project with 23k+ stars, providing a portable, event-driven runtime for building microservices. KubeStellar Console provides comprehensive visibility into Dapr sidecar health, state store connectivity, and pub/sub component status across multiple Kubernetes clusters.

## Multi-Cluster Sidecar Visibility
- **Injection Monitoring** — Track Dapr sidecar injection rates, success/failure counts across clusters
- **Actor State Health** — Monitor Dapr actors, state transfers, and actor reminders across cluster boundaries
- **Pub/Sub Components** — Real-time status of message broker connectivity (RabbitMQ, Kafka, Redis, etc.)
- **Service Invocation** — Cross-cluster service call health and latency metrics
- **Secrets & Configuration** — Track mounted secrets and configuration state across deployments

## Console Integration Features
- **Dapr Health Dashboard** — Unified view of sidecar injection, component health, and runtime errors
- **Distributed Tracing** — Correlate Dapr calls across clusters with timing and error context
- **Component Compliance** — Audit pub/sub, state store, and secret provider configurations for consistency
- **Troubleshooting** — Quick links to failing deployments and detailed pod logs

## Community Resources

### Dapr v1.15+ Multi-Cluster
- [Dapr Documentation](https://dapr.io/docs/)
- [Dapr GitHub](https://github.com/dapr/dapr)
- CNCF Slack: `#dapr`
- CNCF TAG Runtime: `#tag-runtime`

### Distributed App Runtime Community
- Dapr Community Standup (weekly)
- Dapr GitHub Discussions
- KubeStellar Marketplace for Dapr troubleshooting missions

## Proposed Actions
1. **GitHub Discussion** — Open conversation: "How would you monitor Dapr sidecars across multiple clusters?"
2. **Community Feedback** — Validate health monitoring use cases with Dapr teams
3. **Console Card Development** — Build sidecar health card (separate issue)
4. **Mission Creation** — `console-kb` mission for debugging Dapr injection failures across clusters

## How do I get this working with my KubeStellar instance?
[Work with us](https://cloud-native.slack.com/archives/C097094RZ3M) to create integration guides for multi-cluster Dapr deployments and troubleshooting playbooks.

<style type="text/css">
.centerImage
{
    display: block;
    margin: auto;
}
</style>

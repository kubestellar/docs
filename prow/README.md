# Prow Cluster Configuration

This directory contains Kubernetes manifests for the Prow CI cluster.

## Components

### minio-ingress.yaml

Exposes MinIO externally at `minio.kubestellar.io` for:
- Generating presigned URLs for raw build log access in Deck/Spyglass
- External artifact access

The ingress uses:
- nginx ingress controller
- Let's Encrypt TLS via cert-manager

## Related Configuration

The following configurations are managed directly in the cluster:

### ConfigMap: config (prow namespace)
- `gcs_browser_prefix`: Set to `https://gcsweb.kubestellar.io/` (without bucket name suffix)

### Deployment: gcsweb-public
- Serves the `prow-logs` bucket at `gcsweb.kubestellar.io`

### Secret: s3-credentials-internal
- Used by Deck for generating presigned S3 URLs
- Endpoint: `https://minio.kubestellar.io`

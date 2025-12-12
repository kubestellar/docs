# Multi-Namespace and GVRC Support

This document describes the enhanced multi-cluster functionality that supports all namespaces and GVRC (Group, Version, Resource, Category) discovery in KubeStellar.

## Overview

The KubeStellar Agent has been extended to support comprehensive namespace and resource discovery across multiple clusters. This enhancement addresses [Issue #10](https://github.com/kubestellar/a2a/issues/10) by implementing:

- **All-namespaces support**: Operations can now target all namespaces or specific sets of namespaces
- **GVRC discovery**: Comprehensive resource discovery including groups, versions, and categories
- **Namespace management**: Advanced namespace filtering and selection capabilities
- **Enhanced multi-cluster operations**: Improved resource management across cluster boundaries

## New Functions

### 1. GVRC Discovery (`gvrc_discovery`)

Discovers available Kubernetes resources, their versions, and categories across multiple clusters.

**Key Features:**
- API resource discovery (equivalent to `kubectl api-resources`)
- Custom resource (CRD) detection
- Resource categorization and filtering
- Cross-cluster resource inventory
- Namespace-aware resource discovery

**Usage Examples:**
```bash
# Discover all resources across all clusters
uv run python -m src.a2a.cli execute gvrc_discovery

# Filter by resource name pattern
uv run python -m src.a2a.cli execute gvrc_discovery -P resource_filter=pod

# Include only custom resources
uv run python -m src.a2a.cli execute gvrc_discovery -P api_resources=false -P custom_resources=true

# Filter by categories
uv run python -m src.a2a.cli execute gvrc_discovery -P categories='[\"all\", \"core\"]'
```

### 2. Namespace Utils (`namespace_utils`)

Manages namespaces and namespace-scoped resources across multiple clusters.

**Key Features:**
- List all namespaces across clusters
- Get detailed namespace information
- List resources within specific namespaces
- Namespace label selectors
- Resource quotas and limit ranges discovery

**Usage Examples:**
```bash
# List all namespaces across clusters
uv run python -m src.a2a.cli execute namespace_utils -P operation=list -P all_namespaces=true

# Get details for specific namespaces
uv run python -m src.a2a.cli execute namespace_utils -P operation=get -P namespace_names='[\"default\", \"kube-system\"]'

# List resources in all namespaces
uv run python -m src.a2a.cli execute namespace_utils -P operation=list-resources -P all_namespaces=true

# Filter namespaces by labels
uv run python -m src.a2a.cli execute namespace_utils -P operation=list -P namespace_selector=\"env=prod\"
```

## Enhanced Existing Functions

### 1. Multi-Cluster Create (`multicluster_create`)

**New Parameters:**
- `all_namespaces`: Create resources across all namespaces
- `namespace_selector`: Target namespaces using label selectors
- `target_namespaces`: Specify explicit list of target namespaces
- `resource_filter`: Filter resources by name pattern
- `api_version`: Specify API version for resource creation

**Usage Examples:**
```bash
# Create a deployment across all namespaces in all clusters
uv run python -m src.a2a.cli execute multicluster_create \
  -P resource_type=deployment \
  -P resource_name=test-app \
  -P image=nginx:1.21 \
  -P all_namespaces=true

# Create resources in specific namespaces only
uv run python -m src.a2a.cli execute multicluster_create \
  -P filename=/path/to/resource.yaml \
  -P target_namespaces='[\"prod\", \"staging\"]'

# Target namespaces with label selector
uv run python -m src.a2a.cli execute multicluster_create \
  -P resource_type=configmap \
  -P resource_name=app-config \
  -P namespace_selector=\"tier=frontend\"
```

### 2. Multi-Cluster Logs (`multicluster_logs`)

**New Parameters:**
- `all_namespaces`: Get logs from pods across all namespaces
- `namespace_selector`: Target namespaces using label selectors
- `target_namespaces`: Specify explicit list of target namespaces
- `resource_types`: Filter by specific resource types
- `api_version`: Specify API version for resource discovery

**Usage Examples:**
```bash
# Get logs from all pods across all namespaces
uv run python -m src.a2a.cli execute multicluster_logs \
  -P all_namespaces=true \
  -P label_selector=\"app=nginx\"

# Get logs from specific namespaces
uv run python -m src.a2a.cli execute multicluster_logs \
  -P target_namespaces='[\"prod\", \"staging\"]' \
  -P pod_name=web-server

# Target namespaces with label selector
uv run python -m src.a2a.cli execute multicluster_logs \
  -P namespace_selector=\"env=production\" \
  -P follow=true
```

### 3. Deploy To (`deploy_to`)

**New Parameters:**
- `all_namespaces`: Deploy resources across all namespaces
- `namespace_selector`: Target namespaces using label selectors
- `target_namespaces`: Specify explicit list of target namespaces
- `resource_filter`: Filter resources by name pattern
- `api_version`: Specify API version for resource deployment

**Usage Examples:**
```bash
# Deploy to specific clusters and all namespaces
uv run python -m src.a2a.cli execute deploy_to \
  -P target_clusters='[\"prod-cluster\"]' \
  -P filename=/path/to/app.yaml \
  -P all_namespaces=true

# Deploy to specific namespaces in selected clusters
uv run python -m src.a2a.cli execute deploy_to \
  -P target_clusters='[\"cluster1\", \"cluster2\"]' \
  -P resource_type=deployment \
  -P resource_name=web-app \
  -P image=myapp:v1.0 \
  -P target_namespaces='[\"frontend\", \"backend\"]'
```

## Implementation Details

### Namespace Resolution

All enhanced functions use a common namespace resolution mechanism that supports:

1. **Explicit namespace lists** (`target_namespaces`)
2. **All namespaces flag** (`all_namespaces=true`)
3. **Label selectors** (`namespace_selector=\"env=prod\"`)
4. **Single namespace** (`namespace=\"default\"`)
5. **Default fallback** (uses \"default\" namespace if none specified)

### GVRC Discovery

The GVRC discovery function provides comprehensive resource information including:

- **Resource name and short names**
- **API version and kind**
- **Namespace scope** (namespaced vs cluster-scoped)
- **Resource categories** (all, core, extensions, etc.)
- **Custom resource detection**

### Cross-Cluster Consistency

All operations maintain consistency across clusters by:

- Using the same namespace resolution logic
- Providing detailed per-cluster results
- Aggregating success/failure statistics
- Handling cluster-specific errors gracefully

## Best Practices

### 1. Namespace Targeting

```bash
# Recommended: Use explicit namespace lists for production
uv run python -m src.a2a.cli execute multicluster_create \
  -P target_namespaces='[\"prod-frontend\", \"prod-backend\"]' \
  -P filename=production-config.yaml

# Use label selectors for dynamic targeting
uv run python -m src.a2a.cli execute namespace_utils \
  -P operation=list \
  -P namespace_selector=\"tier=web,env=production\"
```

### 2. Resource Discovery

```bash
# Start with GVRC discovery to understand available resources
uv run python -m src.a2a.cli execute gvrc_discovery -P output_format=summary

# Filter by specific categories for focused discovery
uv run python -m src.a2a.cli execute gvrc_discovery \
  -P categories='[\"apps\", \"extensions\"]' \
  -P output_format=detailed
```

### 3. Dry Run Operations

```bash
# Always use dry-run for testing namespace-wide operations
uv run python -m src.a2a.cli execute multicluster_create \
  -P all_namespaces=true \
  -P resource_type=deployment \
  -P resource_name=test-app \
  -P image=nginx \
  -P dry_run=client
```

## Error Handling

The enhanced functions provide comprehensive error handling:

- **Per-namespace error reporting**: Individual namespace failures don't stop overall operation
- **Cluster connectivity validation**: Pre-flight checks ensure cluster accessibility
- **Resource validation**: API version and resource type validation before operations
- **Graceful degradation**: Partial success scenarios are handled appropriately

## Security Considerations

- **Namespace access control**: Functions respect RBAC permissions per namespace
- **Cluster-scoped operations**: Require appropriate cluster-level permissions
- **Resource discovery**: Limited to accessible resources based on user permissions
- **WDS cluster filtering**: Workload Description Space clusters are automatically excluded

## Migration from Previous Versions

Existing function calls remain fully compatible. The new parameters are optional and default to previous behavior:

```bash
# This still works exactly as before
uv run python -m src.a2a.cli execute multicluster_create \
  -P resource_type=deployment \
  -P resource_name=app \
  -P image=nginx \
  -P namespace=production

# Now enhanced with new capabilities
uv run python -m src.a2a.cli execute multicluster_create \
  -P resource_type=deployment \
  -P resource_name=app \
  -P image=nginx \
  -P all_namespaces=true
```

## Troubleshooting

### Common Issues

1. **No clusters discovered**: Ensure kubectl is configured and clusters are accessible
2. **Namespace not found**: Verify namespace exists and user has access permissions
3. **Resource creation failures**: Check RBAC permissions and resource quotas
4. **API version conflicts**: Use GVRC discovery to identify correct API versions

### Debugging Commands

```bash
# Check cluster connectivity
uv run python -m src.a2a.cli execute deploy_to -P list_clusters=true

# Verify namespace access
uv run python -m src.a2a.cli execute namespace_utils -P operation=list

# Discover available resources
uv run python -m src.a2a.cli execute gvrc_discovery -P output_format=detailed
```

## Future Enhancements

The implementation provides a foundation for future enhancements:

- **Resource templates**: Namespace-aware resource templating
- **Batch operations**: Bulk operations across multiple namespaces
- **Resource monitoring**: Cross-namespace resource health monitoring
- **Policy enforcement**: Namespace-based policy validation

## Conclusion

The multi-namespace and GVRC support significantly enhances KubeStellar's multi-cluster management capabilities. Users can now perform sophisticated resource discovery and management operations across cluster and namespace boundaries while maintaining fine-grained control and comprehensive error handling.
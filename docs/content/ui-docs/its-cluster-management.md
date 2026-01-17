# ITS (Inventory and Transport Space)

## Introduction
The Inventory and Transport Space (ITS) in KubeStellar provides a centralized, real-time view of all managed Kubernetes clusters. It is the system of record for cluster inventory, their health and availability, and the labels that organize clusters by environment, region, tier, or any custom taxonomy. Use ITS when you manage multiple clusters across environments (production, staging, dev), geographies, or edge sites, and need consistent discovery, onboarding, and policy-driven organization.

Key benefits:
- Centralized cluster management across many contexts
- Flexible import methods (Quick Connect, Kubeconfig upload, Manual API URL)
- Powerful labeling system (single and bulk operations)
- Fast filtering and search via label chips and status filters
- Real-time status visibility and detail views for each cluster

ITS serves as the entry point for cluster lifecycle operations, integrates with Binding Policies (BP) for label-driven selection, and is a prerequisite for WECs monitoring and workload status aggregation.

## Prerequisites
- KubeStellar core installed and accessible
- Access to Kubernetes clusters to be managed
- Kubeconfig files (for Kubeconfig import)
- Network connectivity to cluster API servers
- Authentication tokens where required

## Feature Overview
- Architecture: ITS aggregates cluster metadata, status, and labels from the KubeStellar backend. It presents search, filters, and actions to manage clusters and labels.
- Cluster lifecycle: Discover → Import → Label → Monitor → Detach. ITS keeps status in sync and exposes per-cluster detail dialogs and logs.
- Relationships:
  - BP: Labels in ITS drive cluster selectors in Binding Policies.
  - WECs: Workloads monitored on clusters imported via ITS; health is visible across systems.
- Key concepts:
  - Cluster contexts: Logical grouping (e.g., `its1`) associated with hub configuration.
  - Label-based organization: Key/value labels for flexible grouping and policy targeting.
  - Status tracking: Active/Unavailable/Pending indicators, plus joined state and metrics in detail view.

---

## Step-by-Step Guides

### Guide 1: Importing Your First Cluster (Quick Connect)

1. **Navigate to ITS page**
   - Open the KubeStellar dashboard and select **"Managed Clusters"** from the main menu.
   
   ![Step 1 — Navigate to ITS](../images/its/locate-managed-clusters.png)

2. **Click "Import Cluster" button**
   - Look for the blue "Import Cluster" button in the top-right of the clusters table.
   
   ![Step 2 — Import Cluster button](../images/its/import-cluster/click-import-cluster.png)

3. **Select "Quick Connect" tab**
   - The import dialog opens with three tabs. Select the "Quick Connect" tab (⚡ icon).
   
   ![Step 3 — Quick Connect tab](../images/its/import-cluster/quick-connect/select-quick-connect-tab.png)

4. **View auto-discovered clusters**
   - The system automatically discovers available clusters from the hub. Wait for the list to populate.
   
   ![Step 4 — Auto-discovered clusters](../images/its/import-cluster/quick-connect/view-auto-discovered-clusters.png)

5. **Click on desired cluster**
   - Select the cluster you want to import from the discovered list.
   
   ![Step 5 — Select cluster](../images/its/import-cluster/quick-connect/select-desired-cluster.png)

6. **Click "Onboard Cluster"**
   - Scroll down and press the **Onboard Cluster** button to start onboarding.
   
   ![Step 6 — Onboard Cluster button](../images/its/import-cluster/quick-connect/click-onboard-cluster.png)

7. **Watch onboarding logs**
   - Observe real-time logs and status updates in the dialog until completion.
   
   ![Step 7 — Onboarding logs](../images/its/import-cluster/quick-connect/watch-onboarding-logs.png)
8. **Verify import success**
   - Return to ITS and confirm the cluster now appears in the table with status "Active".
   
   ![Step 8 — Verify success](../images/its/import-cluster/quick-connect/verify-import-success.png)

### Guide 2: Importing via Kubeconfig

Will be added soon.

### Guide 3: Manual Import with API URL

Will be added soon.

### Guide 4: Adding Labels to Clusters

1. **Locate cluster in table**
   - Find the target cluster in the ITS clusters list.

   ![Step 1 — Locate cluster](../images/its/labelling/locate-cluster.png)

2. **Click on action menu (3 dots)**
   - Open the actions menu for that cluster.

   ![Step 2 — Action menu](../images/its/labelling/click-on-action-menu.png)

3. **Select "Edit Labels"**
   - Choose **Edit Labels** to open the labeling dialog.

   ![Step 3 — Edit Labels](../images/its/labelling/click-edit-labels.png)

4. **Enter key (e.g., environment)**
   - Type the label key, for example `environment`.

   ![Step 4 — Enter key](../images/its/labelling/enter-key.png)

5. **Enter value (e.g., production)**
   - Type the label value, for example `production`.

   ![Step 5 — Enter value](../images/its/labelling/enter-value.png)

6. **Click "Add"**
   - Confirm the new key/value label to add it to the list.

   ![Step 6 — Confirm Add](../images/its/labelling/click-on-add.png)

7. **Click "Save Changes"**
   - Save changes to apply labels to the cluster.

   ![Step 7 — Save](../images/its/labelling/save-changes.png)

### Guide 5: Bulk Labeling Clusters

1. **Select checkboxes for multiple clusters**
   - Use the table checkboxes to select two or more clusters.

   ![Step 1 — Select clusters](../images/its/bulk-labelling/select-clusters.png)

2. **Click "Manage Labels" button**
   - Click on the "Manage Labels" button that appears above the table.

   ![Step 2 — Manage Labels](../images/its/bulk-labelling/click-on-manage-labels.png)

3. **Choose "Bulk Labels"**
   - Choose the **Bulk Labels** option in the dialog.

   ![Step 3 — Choose mode](../images/its/bulk-labelling/choose-bulk-labels.png)

4. **Add new labels**
   - Enter one or more key/value labels to apply.

   ![Step 4 — Add labels](../images/its/bulk-labelling/add-new-labels.png)

5. **Click "Save Changes"**
   - Apply the labels in bulk and wait for confirmation.

   ![Step 5 — Save Changes](../images/its/bulk-labelling/save-changes.png)

6. **Verify labels applied**
   - Ensure labels appear on all selected clusters; check toasts.

   ![Step 6 — Verify labels](../images/its/bulk-labelling/verify-applied-labels.png)

### Guide 6: Filtering Clusters by Labels

1. **Locate label chip on any cluster**
   - Find a label chip (e.g., `environment=production`) on any cluster row.

2. **Click on the label chip**
   - Click the chip to apply a filter for that `key=value`.

   ![Step 2 — Click label chip](../images/its/filter-by-labels/click-label-chip.png)

3. **View filtered results**
   - The table updates to show only clusters matching the selected label.

   ![Step 3 — Filtered results](../images/its/filter-by-labels/view-filtered-results.png)

4. **Add more label filters if needed**
   - Click additional label chips to stack multiple filters.

   ![Step 4 — Add more filters](../images/its/filter-by-labels/add-filters.png)

5. **Remove filters by clicking X**
   - Remove a specific filter by clicking the `X` on its chip.

   ![Step 5 — Remove filter](../images/its/filter-by-labels/remove-filter.png)

6. **Clear all filters with "Clear All"**
   - Click **Clear All** to remove every active filter and restore full results.

   ![Step 6 — Clear All](../images/its/filter-by-labels/clear-filters.png)

## Use Cases

### Use Case 1: Multi-Environment Setup
Scenario: Managing production, staging, and development clusters
Solution:
- Import all clusters
- Label with environment=production|staging|dev
- Label with region=us-east|us-west|eu-central
- Filter by environment when needed
- Create binding policies based on labels

### Use Case 2: Edge Cluster Management
Scenario: Managing 50+ edge clusters across locations
Solution:
- Use Quick Connect for bulk discovery
- Label with location=edge-site-XX
- Label with tier=edge
- Use bulk labeling for common labels
- Filter by location for maintenance

### Use Case 3: Cluster Lifecycle Management
Scenario: Adding and removing clusters dynamically
Solution:
- Import new clusters as they come online
- Monitor status in real-time
- Use labels to track cluster purpose
- Detach decommissioned clusters
- View detachment logs for audit

## Troubleshooting

### Issue 1: Quick Connect not showing clusters
Error: "No clusters discovered"
Solutions:
- Verify hub connection
- Check network connectivity
- Ensure clusters are properly configured
- Review hub API server logs
- Verify authentication tokens

### Issue 2: Kubeconfig import fails
Error: "Invalid kubeconfig format"
Solutions:
- Validate kubeconfig YAML syntax
- Ensure context is present
- Check cluster API server accessibility
- Verify credentials in kubeconfig
- Try different context

### Issue 3: Labels not saving
Error: "Failed to update labels"
Solutions:
- Check label key format (valid Kubernetes label)
- Verify label value format
- Ensure no duplicate labels
- Check backend connectivity
- Review browser console for errors

### Issue 4: Bulk labeling partially fails
Error: "Some clusters failed to update"
Solutions:
- Check individual cluster status
- Retry failed clusters individually
- Verify cluster connectivity
- Review error messages per cluster
- Check backend logs

## Related Features

### Integration with Binding Policies (BP)
- Labels from ITS used in cluster selectors
- Cluster names referenced in policies
- Label suggestions from existing policies
- Real-time policy status per cluster

### Integration with WECs
- Clusters must be imported in ITS first
- WECs monitors workloads on ITS clusters
- Status synced between ITS and WECs
- Cluster context shared

### Integration with Dashboard
- Cluster metrics from ITS shown on Dashboard
- Quick link to ITS from Dashboard
- Cluster health aggregated
- Import button on Dashboard

---

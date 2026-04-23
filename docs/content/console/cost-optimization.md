---
title: Cost Optimization Cards
description: Right-Size Advisor and Cluster Costs cards for workload cost optimization in KubeStellar Console.
---

# Cost Optimization

KubeStellar Console includes cost optimization cards on the **Cost** dashboard.

## Right-Size Advisor

The **Right-Size Advisor** card analyzes workload resource requests and limits against actual utilization to identify over-provisioned workloads.

### What It Shows

- Workloads with CPU requests significantly above actual usage
- Workloads with memory requests above the P95 usage watermark
- Estimated monthly savings from right-sizing
- Recommended new resource values

### Adding the Card

The Right-Size Advisor is available on the Cost dashboard by default. It can also be added to any custom dashboard via **Console Studio**.

## Cluster Costs Card

The **Cluster Costs** card shows estimated cloud infrastructure costs per cluster, broken down by compute, storage, and network. Both the Right-Size Advisor and Cluster Costs cards are sized at half-width to allow side-by-side comparison.

## GPU Metrics

GPU memory metrics are now sourced from the **DCGM exporter** (`feat(gpu): scrape DCGM exporter for real GPU memory metrics`, PR #9314) when available, providing accurate real-time GPU utilization data instead of estimated values.

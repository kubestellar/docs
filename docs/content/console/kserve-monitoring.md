---
title: KServe Monitoring Card
description: Monitor KServe model serving infrastructure with the KubeStellar Console KServe status card.
---

# KServe Monitoring Card

The **KServe Status** card (`kserve_status`) provides real-time visibility into KServe model serving infrastructure across your managed clusters.

## What It Shows

- **InferenceService status** — Ready/Not Ready state for each deployed model
- **Replica counts** — Current vs desired replicas per InferenceService
- **Latency metrics** — P50/P95 request latency where available via DCGM or Prometheus
- **Error rates** — Inference request failures per InferenceService
- **Framework** — Model framework (TensorFlow, PyTorch, ONNX, etc.)

## Adding the Card

1. Open **Console Studio** from the sidebar (the **Add more...** button)
2. Search for **KServe Status**
3. Drag it to your dashboard or click **Add**

## Requirements

- KServe operator installed on managed clusters
- `ClusterRole` with read access to `serving.kserve.io` resources
- Optional: Prometheus/DCGM metrics for latency data

## Demo Mode

When no live KServe installation is detected, the card displays demo data showing a representative set of InferenceServices with varying status states.

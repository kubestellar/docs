---
title: Enterprise Compliance Portal
description: Overview of the KubeStellar Console Enterprise Compliance Portal — a unified dashboard for regulatory compliance across PCI-DSS, SOC 2, NIST, HIPAA, GxP, and more.
---

# Enterprise Compliance Portal

The KubeStellar Console includes a built-in **Enterprise Compliance Portal** accessible at `/enterprise`. It provides compliance dashboards for regulatory frameworks commonly required in enterprise Kubernetes environments.

## Accessing the Portal

Navigate to **Enterprise** in the left sidebar, or go directly to `/enterprise`. The portal requires no additional configuration — it runs in demo mode when no live cluster is connected.

## Available Dashboards

### Compliance Frameworks

The **Compliance Frameworks** dashboard (`/enterprise/frameworks`) provides an overview of all supported regulatory frameworks and your cluster's compliance posture against each.

Supported frameworks:
- **PCI-DSS 4.0** — Payment Card Industry Data Security Standard
- **SOC 2 Type II** — Service Organization Control 2
- **NIST 800-53** — National Institute of Standards and Technology
- **HIPAA Security Rule** — Health Insurance Portability and Accountability Act
- **GxP (21 CFR Part 11)** — FDA Good Practice validation
- **FedRAMP** — Federal Risk and Authorization Management Program
- **STIG** — Security Technical Implementation Guide
- **Air-Gap Compliance** — Isolated network environment requirements

### Segregation of Duties

The **Segregation of Duties** dashboard (`/enterprise/segregation`) enforces SOX and PCI-DSS access control requirements by detecting and reporting role conflicts across your clusters.

### Data Residency

The **Data Residency** dashboard (`/enterprise/data-residency`) tracks where workload data is stored and processed, ensuring compliance with GDPR, CCPA, and regional data sovereignty requirements.

### Change Control

The **Change Control** dashboard (`/enterprise/change-control`) provides a full audit trail of cluster changes for SOX and PCI-DSS compliance, including who made changes, when, and what was affected.

### NIST 800-53 Controls

The **NIST Dashboard** (`/enterprise/nist`) maps your cluster's security configuration to NIST 800-53 control families, showing compliance status for each control.

### OIDC & Identity

The **OIDC Dashboard** (`/enterprise/oidc`) provides visibility into OIDC provider configuration, token policies, and session management across all managed clusters.

### SIEM Integration

The **SIEM Dashboard** (`/enterprise/siem`) surfaces security events and incident response workflows, integrating with your existing SIEM tooling.

### SLSA Supply Chain

The **SLSA Dashboard** (`/enterprise/slsa`) tracks Software Supply Chain Levels for Software Artifacts compliance for your workload images and build pipelines.

## Compliance Report Generator

From any compliance dashboard, use the **Generate Report** button to export a PDF or JSON compliance report. Reports include:
- Current compliance status per framework
- Control pass/fail breakdown
- Remediation recommendations
- Audit-ready timestamps and cluster identification

## Demo Mode

All compliance dashboards include realistic demo data. When no live cluster is connected, the portal automatically shows representative compliance scenarios so you can evaluate the UI and report format before connecting real clusters.

## Navigation

The Enterprise sidebar (`/enterprise`) provides quick navigation between all compliance epics. The sidebar is collapsible and includes keyboard navigation support.

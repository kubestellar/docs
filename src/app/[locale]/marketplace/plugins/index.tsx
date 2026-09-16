"use client";

import { useTranslations } from "next-intl";

import type { Plugin } from "./types";
import { createKubectlMultiPlugin } from "./data/kubectl-multi";
import { createGalaxySyncProPlugin } from "./data/galaxy-sync-pro";
import { createEdgeGuardianPlugin } from "./data/edge-guardian";
import { createStellarInsightsPlugin } from "./data/stellar-insights";
import { createClusterNavigatorPlugin } from "./data/cluster-navigator";
import { createConfigValidatorPlugin } from "./data/config-validator";
import { createDisasterRecoverySuitePlugin } from "./data/disaster-recovery-suite";
import { createAutoScalerProPlugin } from "./data/auto-scaler-pro";
import { createPolicyEnginePlugin } from "./data/policy-engine";
import { createNetworkMeshOptimizerPlugin } from "./data/network-mesh-optimizer";
import { createGitopsBridgePlugin } from "./data/gitops-bridge";
import { createCostAnalyzerPremiumPlugin } from "./data/cost-analyzer-premium";
import { createSecretsManagerPlugin } from "./data/secrets-manager";
import { createLoadBalancerControllerPlugin } from "./data/load-balancer-controller";
import { createWorkloadMigratorPlugin } from "./data/workload-migrator";
import { createMetricsAggregatorPlugin } from "./data/metrics-aggregator";
import { createClusterProvisionerPlugin } from "./data/cluster-provisioner";
import { createAlertManagerPlusPlugin } from "./data/alert-manager-plus";
import { createResourceOptimizerPlugin } from "./data/resource-optimizer";
import { createComplianceReporterPlugin } from "./data/compliance-reporter";
import { createServiceMeshBridgePlugin } from "./data/service-mesh-bridge";
import { createEdgeMonitorProPlugin } from "./data/edge-monitor-pro";
import { createMultiTenancyManagerPlugin } from "./data/multi-tenancy-manager";
import { createChaosEngineeringToolkitPlugin } from "./data/chaos-engineering-toolkit";
import { createKubestellarMcpPlugin } from "./data/kubestellar-mcp";

export type { Plugin } from "./types";

export function usePlugins(): Plugin[] {
  const t = useTranslations("marketplace");

  return [
    createKubectlMultiPlugin(t),
    createGalaxySyncProPlugin(t),
    createEdgeGuardianPlugin(t),
    createStellarInsightsPlugin(t),
    createClusterNavigatorPlugin(t),
    createConfigValidatorPlugin(t),
    createDisasterRecoverySuitePlugin(t),
    createAutoScalerProPlugin(t),
    createPolicyEnginePlugin(t),
    createNetworkMeshOptimizerPlugin(t),
    createGitopsBridgePlugin(t),
    createCostAnalyzerPremiumPlugin(t),
    createSecretsManagerPlugin(t),
    createLoadBalancerControllerPlugin(t),
    createWorkloadMigratorPlugin(t),
    createMetricsAggregatorPlugin(t),
    createClusterProvisionerPlugin(t),
    createAlertManagerPlusPlugin(t),
    createResourceOptimizerPlugin(t),
    createComplianceReporterPlugin(t),
    createServiceMeshBridgePlugin(t),
    createEdgeMonitorProPlugin(t),
    createMultiTenancyManagerPlugin(t),
    createChaosEngineeringToolkitPlugin(t),
    createKubestellarMcpPlugin(t),
  ];
}

// For backward compatibility, export a static version
export const plugins: Plugin[] = [];

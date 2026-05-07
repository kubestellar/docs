"use client";

import { useState, useEffect } from 'react';

// Production URL for fetching shared config
const PRODUCTION_CONFIG_URL = 'https://kubestellar.io/config/shared.json';

// Cache TTL - config will be refreshed after this time
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Type definitions
export interface VersionInfo {
  label: string;
  branch: string;
  isDefault: boolean;
  externalUrl?: string;
  isDev?: boolean;
}

export interface ProjectInfo {
  name: string;
  basePath: string;
  currentVersion: string;
}

export interface RelatedProject {
  title: string;
  href: string;
  description?: string;
  secondary?: boolean;
}

export interface SharedConfig {
  versions: Record<string, Record<string, VersionInfo>>;
  projects: Record<string, ProjectInfo>;
  relatedProjects: RelatedProject[];
  editBaseUrls: Record<string, string>;
  surveyUrl?: string;
  updatedAt: string;
}

// Cache for the config with TTL
let configCache: SharedConfig | null = null;
let cacheTimestamp: number = 0;
let fetchPromise: Promise<SharedConfig | null> | null = null;

function getConfigTimestamp(config: SharedConfig | null): number {
  if (!config?.updatedAt) {
    return 0;
  }

  const timestamp = Date.parse(config.updatedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeVersionMaps(
  primary: Record<string, Record<string, VersionInfo>> = {},
  secondary: Record<string, Record<string, VersionInfo>> = {}
): Record<string, Record<string, VersionInfo>> {
  const mergedProjects = new Set([...Object.keys(secondary), ...Object.keys(primary)]);
  const merged: Record<string, Record<string, VersionInfo>> = {};

  for (const projectId of mergedProjects) {
    merged[projectId] = {
      ...(secondary[projectId] ?? {}),
      ...(primary[projectId] ?? {}),
    };
  }

  return merged;
}

function mergeSharedConfigs(primary: SharedConfig, secondary: SharedConfig): SharedConfig {
  const primaryTimestamp = getConfigTimestamp(primary);
  const secondaryTimestamp = getConfigTimestamp(secondary);

  return {
    versions: mergeVersionMaps(primary.versions, secondary.versions),
    projects: {
      ...(secondary.projects ?? {}),
      ...(primary.projects ?? {}),
    },
    relatedProjects:
      primary.relatedProjects.length > 0 ? primary.relatedProjects : secondary.relatedProjects,
    editBaseUrls: {
      ...(secondary.editBaseUrls ?? {}),
      ...(primary.editBaseUrls ?? {}),
    },
    surveyUrl: primary.surveyUrl ?? secondary.surveyUrl,
    updatedAt:
      primaryTimestamp >= secondaryTimestamp ? primary.updatedAt : secondary.updatedAt,
  };
}

async function fetchConfigJson(url: string, init?: RequestInit): Promise<SharedConfig | null> {
  const res = await fetch(url, init);
  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<SharedConfig>;
}

// Check if cache is still valid
function isCacheValid(): boolean {
  return configCache !== null && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

async function fetchConfig(forceRefresh: boolean = false): Promise<SharedConfig | null> {
  // Return cached config if still valid and not forcing refresh
  if (!forceRefresh && isCacheValid()) {
    return configCache;
  }

  // Return existing fetch promise if in progress (avoid duplicate requests)
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    const [localConfig, productionConfig] = await Promise.all([
      fetchConfigJson('/config/shared.json').catch((e) => {
        console.warn('Failed to fetch local config:', e);
        return null;
      }),
      fetchConfigJson(PRODUCTION_CONFIG_URL, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      }).catch((e) => {
        console.warn('Failed to fetch config from production:', e);
        return null;
      }),
    ]);

    if (localConfig && productionConfig) {
      const mergedConfig =
        getConfigTimestamp(localConfig) >= getConfigTimestamp(productionConfig)
          ? mergeSharedConfigs(localConfig, productionConfig)
          : mergeSharedConfigs(productionConfig, localConfig);
      configCache = mergedConfig;
      cacheTimestamp = Date.now();
      return mergedConfig;
    }

    configCache = localConfig ?? productionConfig;
    if (configCache) {
      cacheTimestamp = Date.now();
    }
    return configCache;
  })().finally(() => {
    // Clear the promise so next call can try again
    fetchPromise = null;
  });

  return fetchPromise;
}

export function useSharedConfig() {
  const [config, setConfig] = useState<SharedConfig | null>(isCacheValid() ? configCache : null);
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If cache is still valid, use it immediately
    if (isCacheValid()) {
      setConfig(configCache);
      setLoading(false);
      return;
    }

    let mounted = true;

    fetchConfig()
      .then((data) => {
        if (mounted) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
}

// Utility functions that work with the shared config
export function getVersionsForProject(
  config: SharedConfig | null,
  projectId: string
): Array<{ key: string } & VersionInfo> {
  if (!config || !config.versions[projectId]) {
    return [];
  }
  return Object.entries(config.versions[projectId]).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export function getProjectInfo(
  config: SharedConfig | null,
  projectId: string
): ProjectInfo | null {
  if (!config || !config.projects[projectId]) {
    return null;
  }
  return config.projects[projectId];
}

export function getEditUrl(
  config: SharedConfig | null,
  projectId: string,
  filePath: string
): string | null {
  if (!config || !config.editBaseUrls[projectId]) {
    return null;
  }
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return `${config.editBaseUrls[projectId]}/${cleanPath}`;
}

// Get survey URL from config or fallback to redirect
export function getSurveyUrl(config: SharedConfig | null): string {
  return config?.surveyUrl ?? 'https://kubestellar.io/survey';
}

// Export the fetch function for server-side usage
export { fetchConfig };

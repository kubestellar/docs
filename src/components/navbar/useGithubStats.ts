"use client";

import { useState, useEffect } from "react";

interface GithubStats {
  stars: string;
  forks: string;
  watchers: string;
}

const REPO = "kubestellar/console";
const SHIELDS_BASE = "https://img.shields.io/github";

const endpoints: Array<{ key: keyof GithubStats; metric: string }> = [
  { key: "stars", metric: "stars" },
  { key: "forks", metric: "forks" },
  { key: "watchers", metric: "watchers" },
];

/**
 * Fetches GitHub repository stats (stars, forks, watchers) via shields.io
 * JSON endpoints to avoid GitHub API rate limits.
 */
export function useGithubStats(): GithubStats {
  const [githubStats, setGithubStats] = useState<GithubStats>({
    stars: "30",
    forks: "25",
    watchers: "1",
  });

  useEffect(() => {
    const fetchStats = async () => {
      const results = await Promise.allSettled(
        endpoints.map(async ({ key, metric }) => {
          const res = await fetch(`${SHIELDS_BASE}/${metric}/${REPO}.json`);
          if (!res.ok) return { key, value: null };
          const data = await res.json();
          return { key, value: data.value as string };
        })
      );

      setGithubStats(prev => {
        const next = { ...prev };
        for (const r of results) {
          if (r.status === "fulfilled" && r.value.value) {
            next[r.value.key] = r.value.value;
          }
        }
        return next;
      });
    };
    fetchStats();
  }, []);

  return githubStats;
}

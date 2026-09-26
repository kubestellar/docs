"use client";

import { useState } from "react";
import type { TopicCluster } from "../types";
import { REPO_COLORS } from "../constants";

// ── Topic Bar ─────────────────────────────────────────────────────────

export function TopicBar({
  topic,
  maxCount,
}: {
  topic: TopicCluster;
  maxCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const widthPct = maxCount > 0 ? (topic.issue_count / maxCount) * 100 : 0;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">
            {topic.name}
          </span>
          <div className="flex items-center gap-2">
            {topic.repos.map((repo) => (
              <span
                key={repo}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${REPO_COLORS[repo] || "text-gray-400 bg-gray-500/10"}`}
              >
                {repo}
              </span>
            ))}
            <span className="text-xs text-gray-400 tabular-nums">
              {topic.issue_count}
            </span>
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div className="w-full bg-gray-700/30 rounded-full h-2.5">
          <div
            className="flex h-full rounded-full overflow-hidden"
            style={{ width: `${widthPct}%` }}
          >
            <div
              className="bg-green-500/60 h-full"
              style={{
                width: `${topic.issue_count > 0 ? (topic.closed_count / topic.issue_count) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-blue-500/60 h-full"
              style={{
                width: `${topic.issue_count > 0 ? (topic.open_count / topic.issue_count) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[10px] text-green-400">
            {topic.closed_count} closed
          </span>
          <span className="text-[10px] text-blue-400">
            {topic.open_count} open
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 ml-4 p-3 bg-gray-800/40 rounded-lg border border-white/5">
          <p className="text-xs text-gray-400 mb-1">Most recent:</p>
          <a
            href={topic.recent_issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {topic.recent_issue.title}
          </a>
          <p className="text-[10px] text-gray-500 mt-1">
            {new Date(topic.recent_issue.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

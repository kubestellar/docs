import type { Suggestion } from "../types";
import { REPO_COLORS } from "../constants";

// ── Suggestion Card ───────────────────────────────────────────────────

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <a
      href={suggestion.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gray-800/40 rounded-lg border border-white/5 hover:border-white/10 hover:bg-gray-800/60 transition-all"
    >
      <p className="text-sm text-white mb-2 line-clamp-2">
        {suggestion.title}
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${REPO_COLORS[suggestion.repo] || "text-gray-400 bg-gray-500/10"}`}
        >
          {suggestion.repo}
        </span>
        <span className="text-[10px] text-gray-500">
          {suggestion.topic_match}
        </span>
      </div>
    </a>
  );
}

// ── Level metadata ────────────────────────────────────────────────────

export interface LevelMeta {
  emoji: string;
  name: string;
  description: string;
  bg: string;
  text: string;
  border: string;
}

export const LEVELS: Record<number, LevelMeta> = {
  // 0 is an internal fallback only — never rendered as its own maturity tier.
  // Projects scoring below L1 display as L1 with an unmet-prerequisites marker.
  0: { emoji: "🔴", name: "Prerequisites",    description: "Baseline prerequisites not yet met (internal fallback; displays as L1)", bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30" },
  1: { emoji: "⚫", name: "Inception",        description: "Basic AI tooling signals (Copilot, formatters)",             bg: "bg-gray-500/20",   text: "text-gray-400",   border: "border-gray-500/30" },
  2: { emoji: "⚪", name: "Advisory",         description: "Has AI instruction files (CLAUDE.md, .cursorrules, etc.)",   bg: "bg-white/10",      text: "text-gray-300",   border: "border-white/20" },
  3: { emoji: "🟡", name: "Quality-Gated",    description: "PR review rubric, quality dashboard, CI matrix",             bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  4: { emoji: "🔵", name: "Security-Aware",   description: "Auto-QA tuning, nightly compliance, AI-fix workflows",      bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30" },
  5: { emoji: "🟢", name: "Semi-Autonomous",  description: "GitHub Actions AI, auto-QA self-tuning, public metrics",    bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30" },
  6: { emoji: "🟣", name: "Fully Autonomous", description: "Fully autonomous AI-driven development and operations",     bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
};

// ── Scannable criteria per level (from acmm.ts source of truth) ────────
// L2 OR-groups 4 instruction files → 1, so effective counts differ from raw.
// 65 total criteria, 34 effective scannable.

const SCANNABLE_PER_LEVEL: Record<number, number> = {
  0: 8,   // prereq-test-suite, prereq-e2e, prereq-cicd, etc.
  2: 3,   // agent-instructions (OR-group), prompts-catalog, editor-config
  3: 4,   // pr-acceptance-metric, pr-review-rubric, quality-dashboard, ci-matrix
  4: 7,   // auto-qa-tuning, nightly-compliance, copilot-review-apply, etc.
  5: 6,   // github-actions-ai, auto-qa-self-tuning, public-metrics, etc.
  6: 6,   // auto-issue-gen, multi-agent-orchestration, merge-queue, etc.
};

/** Cumulative scannable criteria at each level (L0 through given level). */
export const CUMULATIVE_SCANNABLE: Record<number, number> = {};
{
  let cumul = 0;
  for (const lvl of [0, 1, 2, 3, 4, 5, 6]) {
    cumul += SCANNABLE_PER_LEVEL[lvl] || 0;
    CUMULATIVE_SCANNABLE[lvl] = cumul;
  }
}

export const TOTAL_CRITERIA = 65;
export const TOTAL_SCANNABLE = 34;

// ── Level computation (mirrors computeLevel.ts from console) ─────────
// Scannable criterion IDs per level — L2 uses the virtual OR-group.
// Must stay in sync with scannableIdsByLevel.ts in kubestellar/console.

const AGENT_INSTRUCTION_IDS = new Set([
  "acmm:claude-md", "acmm:copilot-instructions",
  "acmm:agents-md", "acmm:cursor-rules",
]);

// Synced from kubestellar/console web/src/lib/acmm/scannableIdsByLevel.ts
const SCANNABLE_IDS_BY_LEVEL: Record<number, string[]> = {
  2: ["acmm:agent-instructions", "acmm:prompts-catalog", "acmm:editor-config"],
  3: ["acmm:pr-acceptance-metric", "acmm:pr-review-rubric", "acmm:quality-dashboard", "acmm:ci-matrix"],
  4: ["acmm:auto-qa-tuning", "acmm:nightly-compliance", "acmm:copilot-review-apply", "acmm:auto-label", "acmm:ai-fix-workflow", "acmm:tier-classifier", "acmm:security-ai-md"],
  5: ["acmm:github-actions-ai", "acmm:auto-qa-self-tuning", "acmm:public-metrics", "acmm:policy-as-code", "acmm:reflection-log", "acmm:audit-trail"],
  6: ["acmm:auto-issue-gen", "acmm:multi-agent-orchestration", "acmm:merge-queue", "acmm:strategic-dashboard", "acmm:risk-assessment-config", "acmm:observability-runbook"],
};

const LEVEL_COMPLETION_THRESHOLD = 0.7;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 6;

export function levelFromDetectedIds(rawIds: string[]): number {
  const detected = new Set(rawIds);
  // Synthesise virtual OR-group: any instruction file → virtual ID
  for (const id of AGENT_INSTRUCTION_IDS) {
    if (detected.has(id)) { detected.add("acmm:agent-instructions"); break; }
  }
  // Threshold walk L2–L6
  let level = MIN_LEVEL;
  for (let n = MIN_LEVEL + 1; n <= MAX_LEVEL; n++) {
    const required = SCANNABLE_IDS_BY_LEVEL[n];
    if (!required?.length) continue;
    const met = required.filter((id) => detected.has(id)).length;
    const threshold = n === 2 ? 1 / required.length : LEVEL_COMPLETION_THRESHOLD;
    if (met / required.length >= threshold) {
      level = n;
    } else {
      break;
    }
  }
  return level;
}

/** Fallback: estimate level from score count when detectedIds unavailable. */
export function levelFromScore(score: number): number {
  const levels = [6, 5, 4, 3, 2, 1, 0] as const;
  for (const lvl of levels) {
    if (score >= (CUMULATIVE_SCANNABLE[lvl] || 0) && (CUMULATIVE_SCANNABLE[lvl] || 0) > 0) {
      return lvl;
    }
  }
  return score > 0 ? 1 : 0;
}

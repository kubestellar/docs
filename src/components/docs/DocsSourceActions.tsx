"use client";

import { useSharedConfig } from "@/hooks/useSharedConfig";
import type { ProjectId } from "@/config/versions";
import { GitPullRequest, FileCode, AlertCircle } from "lucide-react";
import { getKubestellarEditBaseUrl } from "@/lib/url";


const STATIC_EDIT_BASE_URLS: Record<ProjectId, string> = {
  kubestellar: getKubestellarEditBaseUrl(),
  a2a: "https://github.com/kubestellar/a2a/edit/main/docs",
  kubeflex: "https://github.com/kubestellar/kubeflex/edit/main/docs",
  "multi-plugin": "https://github.com/kubestellar/kubectl-multi-plugin/edit/main/docs",
  "kubestellar-mcp": "https://github.com/kubestellar/kubectl-claude/edit/main/docs",
  console: 'https://github.com/kubestellar/console/edit/main/docs',
};

// Prevent path traversal
function sanitizeFilePath(filePath: string): string {
  return filePath.replace(/\.\./g, "").replace(/^\/+/, "");
}

// Force fork-based editing for ALL users (including admins)
function buildGitHubEditUrl(
  filePath: string,
  projectId: ProjectId,
  editBaseUrls?: Record<string, string>
): string | null {
  // For kubestellar, always use the branch-aware static URL so that the edit link
  // correctly targets the deployed branch (e.g. docs/0.29.0) rather than whatever
  // branch value the shared config happens to carry.
  const baseUrl =
    projectId === 'kubestellar'
      ? STATIC_EDIT_BASE_URLS[projectId]
      : (editBaseUrls?.[projectId] ?? STATIC_EDIT_BASE_URLS[projectId]);

  if (!baseUrl) return null;

  return `${baseUrl}/${sanitizeFilePath(filePath)}?fork=true`;
}

// Validate GitHub edit URL
function isValidGitHubEditUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "github.com" &&
      parsed.pathname.includes("/edit/")
    );
  } catch {
    return false;
  }
}

// Convert edit → blob 
function buildSourceUrl(editUrl: string): string {
  const url = new URL(editUrl);
  url.search = "";
  url.pathname = url.pathname.replace("/edit/", "/blob/");
  return url.toString();
}

// Build GitHub issue link
function buildIssueUrl(pageTitle: string, sourceUrl: string): string {
  return `https://github.com/kubestellar/docs/issues/new?title=${encodeURIComponent(
    `Docs: ${pageTitle}`
  )}&body=${encodeURIComponent(`Source file:\n${sourceUrl}`)}`;
}

type DocsSourceActionsProps = {
  filePath: string;
  projectId: ProjectId;
  pageTitle: string;
  variant?: "full" | "compact";
};

export function DocsSourceActions({
  filePath,
  projectId,
  pageTitle,
  variant = "full",
}: DocsSourceActionsProps) {
  const { config } = useSharedConfig();

  const editUrl = buildGitHubEditUrl(
    filePath,
    projectId,
    config?.editBaseUrls
  );

  if (!editUrl || !isValidGitHubEditUrl(editUrl)) return null;

  const safeEditUrl = new URL(editUrl).href;
  const sourceUrl = buildSourceUrl(safeEditUrl);
  const issueUrl = buildIssueUrl(pageTitle, sourceUrl);

  return (
    <div
      className={
        variant === "compact"
          ? "flex gap-2"
          : "flex flex-wrap gap-2"
      }
    >
      <ActionLink
        href={safeEditUrl}
        compact={variant === "compact"}
        title="Compose a PR"
      >
        <GitPullRequest className="h-4 w-4" />
        {variant === "full" && "Compose a PR"}
      </ActionLink>

      <ActionLink
        href={sourceUrl}
        compact={variant === "compact"}
        title="View Source"
      >
        <FileCode className="h-4 w-4" />
        {variant === "full" && "View Source"}
      </ActionLink>

      <ActionLink
        href={issueUrl}
        compact={variant === "compact"}
        title="Open Issue"
      >
        <AlertCircle className="h-4 w-4" />
        {variant === "full" && "Open Issue"}
      </ActionLink>
    </div>
  );
}

function ActionLink({
  href,
  children,
  compact,
  title,
}: {
  href: string;
  children: React.ReactNode;
  compact?: boolean;
  title?: string;
}) {
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "inline-flex items-center justify-center rounded-md border font-medium transition-all duration-150",
        compact
          ? "h-11 w-11 border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800"
          : "min-w-[150px] gap-2 px-3 py-1.5 text-sm",
        "border-gray-300 text-gray-800 bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
        "hover:bg-gray-100 hover:border-gray-400 dark:hover:bg-gray-800 dark:hover:border-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

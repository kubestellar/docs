"use client";

import { useSharedConfig } from "@/hooks/useSharedConfig";
import type { ProjectId } from "@/config/versions";

const STATIC_EDIT_BASE_URLS: Record<ProjectId, string> = {
  kubestellar: "https://github.com/kubestellar/docs/edit/main/docs/content",
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
  const baseUrl =
    editBaseUrls?.[projectId] ?? STATIC_EDIT_BASE_URLS[projectId];

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
};

export function DocsSourceActions({
  filePath,
  projectId,
  pageTitle,
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
    <div className="flex gap-2">
      <ActionLink href={safeEditUrl}>Compose a PR</ActionLink>
      <ActionLink href={sourceUrl}>View Source</ActionLink>
      <ActionLink href={issueUrl}>Open Issue</ActionLink>
    </div>
  );
}

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 min-w-[120px] justify-center rounded-md border px-3 py-1.5 text-sm font-medium
        border-gray-300 text-gray-800 bg-white
        dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
        hover:bg-gray-100 hover:border-gray-400
        dark:hover:bg-gray-800 dark:hover:border-gray-500
        focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600
        transition-all duration-150"
    >
      {children}
    </a>
  );
}

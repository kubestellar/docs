"use client";

import { buildGitHubEditUrl } from "./EditPageLink";
import { useSharedConfig } from "@/hooks/useSharedConfig";
import type { ProjectId } from "@/config/versions";

type DocsSourceActionsProps = {
  filePath: string;
  projectId: ProjectId;
  pageTitle: string;
};

export function DocsSourceActions({filePath, projectId, pageTitle,}: DocsSourceActionsProps) {
  const { config } = useSharedConfig();
  const editUrl = buildGitHubEditUrl(
    filePath,
    projectId,
    config?.editBaseUrls
  );

  if (!editUrl) return null;

  // convert /edit/ → /blob/ to view source
  const sourceUrl = editUrl.replace("/edit/", "/blob/");
  const issueUrl = `https://github.com/kubestellar/docs/issues/new?title=${encodeURIComponent(
  `Docs: ${pageTitle}`
  )}&body=${encodeURIComponent(`Source file:\n${sourceUrl}`)}`;

  return (
    <div className="flex gap-2">
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium
           border-gray-300 text-gray-800 bg-white
           dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
           hover:bg-gray-100 hover:border-gray-400
           dark:hover:bg-gray-800 dark:hover:border-gray-500
           focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600
           transition-all duration-150"
      >
        View Source
      </a>

      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium
           border-gray-300 text-gray-800 bg-white
           dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
           hover:bg-gray-100 hover:border-gray-400
           dark:hover:bg-gray-800 dark:hover:border-gray-500
           focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600
           transition-all duration-150"
      >
        Open Issue
      </a>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Monitor,
  Rocket,
  Terminal,
  X,
} from "lucide-react";

import {
  CONSOLE_DEFAULT_PORT,
  TYPE_CONFIG,
  detectConsole,
} from "../lib/constants";
import type { ConsoleStatus, MarketplaceItem } from "../lib/types";

export function InstallModal({
  item,
  onClose,
}: {
  item: MarketplaceItem;
  onClose: () => void;
}) {
  const [consoleStatus, setConsoleStatus] = useState<ConsoleStatus>("detecting");
  const [consolePort, setConsolePort] = useState(CONSOLE_DEFAULT_PORT);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<"success" | "error" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  useEffect(() => {
    setConsoleStatus("detecting");
    detectConsole(consolePort).then((found) =>
      setConsoleStatus(found ? "running" : "not-running"),
    );
  }, [consolePort]);

  const handleInstallToConsole = useCallback(async () => {
    setInstalling(true);
    setInstallResult(null);
    try {
      const itemRes = await fetch(item.downloadUrl);
      if (!itemRes.ok) throw new Error("Failed to download item");
      const itemJson = await itemRes.json();

      const baseUrl = `http://localhost:${consolePort}`;
      if (item.type === "dashboard") {
        const res = await fetch(`${baseUrl}/api/dashboards/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(itemJson),
        });
        if (!res.ok) throw new Error(`Console returned ${res.status}`);
      } else {
        window.open(
          `${baseUrl}/?marketplace-install=${encodeURIComponent(item.id)}`,
          "_blank",
        );
      }
      setInstallResult("success");
    } catch {
      window.open(
        `http://localhost:${consolePort}/?marketplace-install=${encodeURIComponent(item.id)}`,
        "_blank",
      );
      setInstallResult("success");
    } finally {
      setInstalling(false);
    }
  }, [item, consolePort]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${config.bg}`}>
              <Icon size={20} className={config.color} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
              <span className="text-xs text-gray-500">v{item.version} · {config.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Monitor size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                KubeStellar Console
              </span>
              {consoleStatus === "detecting" && (
                <span className="flex items-center gap-1.5 text-xs text-yellow-400 ml-auto">
                  <Loader2 size={12} className="animate-spin" />
                  Detecting...
                </span>
              )}
              {consoleStatus === "running" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 ml-auto">
                  <CheckCircle2 size={12} />
                  Running on port {consolePort}
                </span>
              )}
              {consoleStatus === "not-running" && (
                <span className="flex items-center gap-1.5 text-xs text-red-400 ml-auto">
                  <AlertCircle size={12} />
                  Not detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Port:</span>
              <input
                type="number"
                value={consolePort}
                onChange={(e) => setConsolePort(Number(e.target.value) || CONSOLE_DEFAULT_PORT)}
                className="w-20 px-2 py-1 rounded bg-gray-700/50 border border-gray-600/30 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => {
                  setConsoleStatus("detecting");
                  detectConsole(consolePort).then((found) =>
                    setConsoleStatus(found ? "running" : "not-running"),
                  );
                }}
                className="px-2 py-1 rounded bg-gray-700/50 border border-gray-600/30 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          </div>

          {consoleStatus === "running" && (
            <div className="space-y-3 pb-2">
              {installResult === "success" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                  <CheckCircle2 size={16} />
                  Sent to Console! Check your local Console to confirm.
                </div>
              ) : (
                <button
                  onClick={handleInstallToConsole}
                  disabled={installing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
                >
                  {installing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Install to Console
                    </>
                  )}
                </button>
              )}
              {installResult === "error" && (
                <p className="text-xs text-red-400 text-center">
                  Could not install directly. The Console marketplace page was opened instead.
                </p>
              )}
            </div>
          )}

          {consoleStatus === "not-running" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Install KubeStellar Console first, then install this {config.label.toLowerCase()} with one click.
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Install Console
                </h4>

                <div className="rounded-lg bg-gray-800/50 border border-gray-700/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-300">Quick Install</span>
                    <button
                      onClick={() => copyToClipboard("curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash", "curl")}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      {copied === "curl" ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <code className="block text-xs text-blue-300 bg-black/30 rounded px-2 py-1.5 font-mono break-all">
                    curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Terminal size={14} className="text-gray-500" />
                <p className="text-xs text-gray-500">
                  After installing, click &quot;Install to Console&quot; above.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700/30">
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600/30 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
            >
              <Download size={14} />
              Download JSON manually
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

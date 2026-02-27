"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Navbar,
  Footer,
  GridLines,
  StarField,
} from "@/components/index";
import {
  Search,
  LayoutDashboard,
  Puzzle,
  Palette,
  Package,
  Download,
  Tag,
  User,
  ExternalLink,
  ChevronDown,
  Loader2,
  Monitor,
  CheckCircle2,
  AlertCircle,
  X,
  Terminal,
  Copy,
  Rocket,
} from "lucide-react";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  author: string;
  authorGithub?: string;
  version: string;
  downloadUrl: string;
  tags: string[];
  cardCount: number;
  type: "dashboard" | "card-preset" | "theme";
  themeColors?: string[];
}

interface RegistryData {
  version: string;
  updatedAt: string;
  items: MarketplaceItem[];
  presets?: MarketplaceItem[];
}

const TYPE_CONFIG = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  "card-preset": {
    label: "Card Preset",
    icon: Puzzle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  theme: {
    label: "Theme",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
};

const REGISTRY_URL =
  "https://raw.githubusercontent.com/kubestellar/console-marketplace/main/registry.json";

const CONSOLE_DEFAULT_PORT = 8080;
const CONSOLE_DETECT_TIMEOUT = 3000;

type ConsoleStatus = "unknown" | "detecting" | "running" | "not-running";

async function detectConsole(port = CONSOLE_DEFAULT_PORT): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONSOLE_DETECT_TIMEOUT);
    await fetch(`http://localhost:${port}/`, {
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function InstallModal({
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
      setConsoleStatus(found ? "running" : "not-running")
    );
  }, [consolePort]);

  const handleInstallToConsole = useCallback(async () => {
    setInstalling(true);
    setInstallResult(null);
    try {
      // Fetch the item JSON from its download URL
      const itemRes = await fetch(item.downloadUrl);
      if (!itemRes.ok) throw new Error("Failed to download item");
      const itemJson = await itemRes.json();

      // Determine API endpoint based on item type
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
        // Card presets and themes: open Console with install hint
        window.open(
          `${baseUrl}/?marketplace-install=${encodeURIComponent(item.id)}`,
          "_blank"
        );
      }
      setInstallResult("success");
    } catch {
      // CORS or network error — fall back to opening Console marketplace
      window.open(
        `http://localhost:${consolePort}/?marketplace-install=${encodeURIComponent(item.id)}`,
        "_blank"
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
        {/* Header */}
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
          {/* Console Detection Status */}
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

            {/* Custom port input */}
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
                    setConsoleStatus(found ? "running" : "not-running")
                  );
                }}
                className="px-2 py-1 rounded bg-gray-700/50 border border-gray-600/30 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          </div>

          {/* Install to Console (when running) */}
          {consoleStatus === "running" && (
            <div className="space-y-3">
              {installResult === "success" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                  <CheckCircle2 size={16} />
                  Sent to Console! Check your local Console to confirm.
                </div>
              ) : (
                <button
                  onClick={handleInstallToConsole}
                  disabled={installing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
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

          {/* Install Console (when not running) */}
          {consoleStatus === "not-running" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Install KubeStellar Console first, then install this {config.label.toLowerCase()} with one click.
              </p>

              {/* Quick install */}
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

          {/* Always show manual download */}
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

export default function MarketplacePage() {
  const [data, setData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(REGISTRY_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch marketplace data");
        return res.json();
      })
      .then((d: RegistryData) => {
        const allItems = [...(d.items || []), ...(d.presets || [])];
        setData({ ...d, items: allItems });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Close tag dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allTags = useMemo(() => {
    if (!data) return [];
    const tags = new Set<string>();
    data.items.forEach((item) => item.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesTag =
        tagFilter === "all" || item.tags.includes(tagFilter);
      return matchesSearch && matchesType && matchesTag;
    });
  }, [data, search, typeFilter, tagFilter]);

  const typeCounts = useMemo(() => {
    if (!data) return { all: 0, dashboard: 0, "card-preset": 0, theme: 0 };
    const counts: Record<string, number> = { all: data.items.length };
    data.items.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [data]);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <StarField density="low" showComets={true} cometCount={2} />
        <GridLines />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-gradient">Marketplace</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Dashboards, card presets, and themes for KubeStellar Console.
              Install directly to your local Console with one click.
            </p>
            {data && (
              <p className="text-sm text-gray-500 mt-3">
                {data.items.length} items available · Registry v{data.version}
              </p>
            )}
          </div>

          {/* Search + Filters */}
          <div className="mb-10 space-y-4">
            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search dashboards, presets, themes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Type filter pills + tag dropdown */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(
                [
                  { key: "all", label: "All", icon: Package },
                  { key: "dashboard", label: "Dashboards", icon: LayoutDashboard },
                  { key: "card-preset", label: "Card Presets", icon: Puzzle },
                  { key: "theme", label: "Themes", icon: Palette },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    typeFilter === key
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600/70 hover:text-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  <span className="text-xs opacity-70">
                    ({typeCounts[key] || 0})
                  </span>
                </button>
              ))}

              {/* Tag filter dropdown */}
              <div ref={tagRef} className="relative">
                <button
                  onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    tagFilter !== "all"
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600/70 hover:text-gray-300"
                  }`}
                >
                  <Tag size={16} />
                  {tagFilter === "all" ? "Tag" : tagFilter}
                  <ChevronDown size={14} />
                </button>
                {tagDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-56 max-h-64 overflow-y-auto rounded-lg bg-gray-800 border border-gray-700/50 shadow-xl z-50">
                    <button
                      onClick={() => {
                        setTagFilter("all");
                        setTagDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        tagFilter === "all"
                          ? "text-blue-300 bg-blue-500/10"
                          : "text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      All Tags
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setTagFilter(tag);
                          setTagDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                          tagFilter === tag
                            ? "text-blue-300 bg-blue-500/10"
                            : "text-gray-300 hover:bg-gray-700/50"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading / Error states */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <span className="ml-3 text-gray-400">
                Loading marketplace...
              </span>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-2">Failed to load marketplace</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Showing {filtered.length} of {data?.items.length} items
                {search && ` matching "${search}"`}
              </p>

              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Package size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No items match your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((item) => (
                    <MarketplaceCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="inline-block rounded-xl bg-gray-800/50 border border-gray-700/50 p-8 backdrop-blur-md">
              <h3 className="text-xl font-semibold text-white mb-2">
                Want to contribute?
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Create your own dashboards, card presets, or themes and share them
                with the KubeStellar community.
              </p>
              <a
                href="https://github.com/kubestellar/console-marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105"
              >
                <ExternalLink size={16} />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function MarketplaceCard({ item }: { item: MarketplaceItem }) {
  const [showInstall, setShowInstall] = useState(false);
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className="group bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-1 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${config.bg}`}>
            <Icon size={20} className={config.color} />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
              {item.name}
            </h3>
            <span className="text-xs text-gray-500">v{item.version}</span>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border ${config.badge}`}
        >
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-3">
        {item.description}
      </p>

      {/* Theme color swatches */}
      {item.type === "theme" && item.themeColors && (
        <div className="flex gap-1.5 mb-4">
          {item.themeColors.map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-gray-600/50"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {item.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-600/30"
          >
            {tag}
          </span>
        ))}
        {item.tags.length > 4 && (
          <span className="text-xs px-2 py-0.5 text-gray-500">
            +{item.tags.length - 4}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/30 mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <User size={12} />
          {item.authorGithub ? (
            <a
              href={`https://github.com/${item.authorGithub}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              {item.author}
            </a>
          ) : (
            <span>{item.author}</span>
          )}
          {item.cardCount > 0 && (
            <span className="ml-2">· {item.cardCount} card{item.cardCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Download size={12} />
            JSON
          </a>
          <button
            onClick={() => setShowInstall(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105"
          >
            <Rocket size={12} />
            Install
          </button>
        </div>
      </div>

      {/* Install Modal */}
      {showInstall && (
        <InstallModal item={item} onClose={() => setShowInstall(false)} />
      )}
    </div>
  );
}

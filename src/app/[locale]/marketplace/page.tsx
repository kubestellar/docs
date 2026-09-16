"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Package,
  Palette,
  Puzzle,
  Search,
  Tag,
} from "lucide-react";

import { Footer, GridLines, Navbar, StarField } from "@/components/index";

import { MarketplaceCard } from "./components/MarketplaceCard";
import { REGISTRY_URL } from "./lib/constants";
import type { RegistryData } from "./lib/types";

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
    const FETCH_TIMEOUT_MS = 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(REGISTRY_URL, { signal: controller.signal })
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
        const message = e.name === "AbortError"
          ? "Request timed out. The marketplace registry may be temporarily unavailable."
          : e.message;
        setError(message);
        setLoading(false);
      })
      .finally(() => clearTimeout(timer));
  }, []);

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
      const matchesTag = tagFilter === "all" || item.tags.includes(tagFilter);
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

          <div className="mb-10 space-y-4">
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
              <Package size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-red-400 mb-2">Failed to load marketplace</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
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
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600/30 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
                >
                  Retry
                </button>
                <a
                  href="https://github.com/kubestellar/console-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600/30 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
                >
                  <ExternalLink size={14} />
                  Browse on GitHub
                </a>
              </div>
            </div>
          )}

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

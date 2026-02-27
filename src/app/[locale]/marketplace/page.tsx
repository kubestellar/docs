"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
        setData(d);
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
              Install with one click from the Console UI.
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
        <a
          href={item.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Download size={12} />
          JSON
        </a>
      </div>
    </div>
  );
}

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);

  // // Extract unique categories
  // const categories = useMemo(() => {
  //   const cats = new Set(plugins.map(p => p.category));
  //   return ["All", ...Array.from(cats)];
  // }, [plugins]);

  // // Filter plugins
  // const filteredPlugins = useMemo(() => {
  //   return plugins.filter(plugin => {
  //     const matchesSearch =
  //       plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       plugin.tags.some(tag =>
  //         tag.toLowerCase().includes(searchQuery.toLowerCase())
  //       );

  //     const matchesCategory =
  //       selectedCategory === "All" || plugin.category === selectedCategory;

  //     const matchesPricing =
  //       selectedPricing === "All" || plugin.pricing.type === selectedPricing;

  //     return matchesSearch && matchesCategory && matchesPricing;
  //   });
  // }, [plugins, searchQuery, selectedCategory, selectedPricing]);

  // // Pagination
  // const totalPages = Math.ceil(filteredPlugins.length / PLUGINS_PER_PAGE);
  // const paginatedPlugins = useMemo(() => {
  //   const startIndex = (currentPage - 1) * PLUGINS_PER_PAGE;
  //   return filteredPlugins.slice(startIndex, startIndex + PLUGINS_PER_PAGE);
  // }, [filteredPlugins, currentPage]);

  // // Reset to page 1 when filters change
  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [searchQuery, selectedCategory, selectedPricing]);

  // return (
  //   <main className="min-h-screen bg-[#0a0a0a]">
  //     <Navbar />

  //     {/* Hero Section */}
  //     <section className="relative pt-40 pb-32 overflow-hidden">
  //       {/* Background Effects */}
  //       <div className="absolute inset-0 z-0">
  //         <StarField density="medium" showComets={true} cometCount={3} />
  //         <GridLines />
  //       </div>

  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
  //         <div className="text-center mb-16">
  //           <h1 className="text-5xl md:text-7xl font-bold mb-8">
  //             <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
  //               KubeStellar Galaxy
  //             </span>
  //             <br />
  //             <span className="text-white">Marketplace</span>
  //           </h1>
  //           <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
  //             Extend your KubeStellar deployment with powerful plugins and
  //             tools. From free community projects to enterprise solutions.
  //           </p>

  //           {/* Stats */}
  //           <div className="flex flex-wrap justify-center gap-8 mt-12">
  //             <div className="text-center">
  //               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
  //                 {plugins.length}+
  //               </div>
  //               <div className="text-gray-400 text-sm md:text-base">
  //                 Plugins Available
  //               </div>
  //             </div>
  //             <div className="text-center">
  //               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
  //                 {plugins.filter(p => p.pricing.type === "free").length}
  //               </div>
  //               <div className="text-gray-400 text-sm md:text-base">
  //                 Free Plugins
  //               </div>
  //             </div>
  //             <div className="text-center">
  //               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
  //                 {Math.floor(plugins.reduce((sum, p) => sum + p.downloads, 0))}
  //                 +
  //               </div>
  //               <div className="text-gray-400 text-sm md:text-base">
  //                 Total Downloads
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </section>

  //     {/* Featured & Most Popular Plugins Carousel */}
  //     <section className="relative py-12 overflow-hidden">
  //       <div className="absolute inset-0 z-0">
  //         <StarField density="low" showComets={false} cometCount={0} />
  //       </div>

  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12">
  //         <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
  //           <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
  //             {t("featured.title")}
  //           </span>{" "}
  //           {t("featured.titleSuffix")}
  //         </h2>
  //         <p className="text-gray-400 text-center mb-8">
  //           {t("featured.subtitle")}
  //         </p>
  //       </div>

  //       {/* Desktop Sliding View */}
  //       <div className="hidden lg:block relative">
  //         <div className="overflow-hidden">
  //           <div className="flex gap-6 animate-slide-partners">
  //             {/* Get top 6 plugins by downloads and triple them for seamless loop */}
  //             {[
  //               ...plugins
  //                 .slice()
  //                 .sort((a, b) => b.downloads - a.downloads)
  //                 .slice(0, 6),
  //               ...plugins
  //                 .slice()
  //                 .sort((a, b) => b.downloads - a.downloads)
  //                 .slice(0, 6),
  //               ...plugins
  //                 .slice()
  //                 .sort((a, b) => b.downloads - a.downloads)
  //                 .slice(0, 6),
  //             ].map((plugin, index) => (
  //               <div
  //                 key={`${plugin.id}-${index}`}
  //                 className="flex-shrink-0 w-[400px] group/card"
  //                 onMouseEnter={e => {
  //                   e.currentTarget
  //                     .closest(".animate-slide-partners")
  //                     ?.classList.add("pause-animation");
  //                 }}
  //                 onMouseLeave={e => {
  //                   e.currentTarget
  //                     .closest(".animate-slide-partners")
  //                     ?.classList.remove("pause-animation");
  //                 }}
  //               >
  //                 <Link
  //                   href={`/marketplace/${plugin.slug}`}
  //                   className="relative block bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 h-80 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-500/50 hover:-translate-y-1"
  //                 >
  //                   {/* Badge for pricing */}
  //                   <div className="absolute top-4 right-4">
  //                     {plugin.pricing.type === "free" ? (
  //                       <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">
  //                         FREE
  //                       </span>
  //                     ) : (
  //                       <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
  //                         ${plugin.pricing.amount}
  //                       </span>
  //                     )}
  //                   </div>

  //                   <div className="transition-all duration-300 group-hover/card:-translate-y-2 h-full flex flex-col">
  //                     {/* Icon */}
  //                     <div className="text-6xl mb-4 group-hover/card:scale-110 transition-transform duration-300">
  //                       {plugin.icon}
  //                     </div>

  //                     {/* Title */}
  //                     <h3 className="text-2xl font-bold text-white mb-3 group-hover/card:text-purple-400 transition-colors">
  //                       {plugin.name}
  //                     </h3>

  //                     {/* Description */}
  //                     <p className="text-gray-300 leading-relaxed text-sm mb-4 flex-grow line-clamp-3">
  //                       {plugin.tagline}
  //                     </p>

  //                     {/* Stats */}
  //                     <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
  //                       <div className="flex items-center gap-1">
  //                         <svg
  //                           className="w-4 h-4 text-yellow-500"
  //                           fill="currentColor"
  //                           viewBox="0 0 20 20"
  //                         >
  //                           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  //                         </svg>
  //                         <span>{plugin.rating}</span>
  //                       </div>
  //                       <div className="flex items-center gap-1">
  //                         <svg
  //                           className="w-4 h-4"
  //                           fill="none"
  //                           stroke="currentColor"
  //                           viewBox="0 0 24 24"
  //                         >
  //                           <path
  //                             strokeLinecap="round"
  //                             strokeLinejoin="round"
  //                             strokeWidth={2}
  //                             d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  //                           />
  //                         </svg>
  //                         <span>{plugin.downloads.toLocaleString()}</span>
  //                       </div>
  //                     </div>

  //                     {/* Category Badge */}
  //                     <div>
  //                       <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
  //                         {plugin.category}
  //                       </span>
  //                     </div>
  //                   </div>

  //                   {/* Learn More */}
  //                   <div className="absolute bottom-6 right-6 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
  //                     <span className="text-purple-400 font-semibold flex items-center gap-2">
  //                       View Details
  //                       <svg
  //                         className="w-4 h-4"
  //                         fill="none"
  //                         stroke="currentColor"
  //                         viewBox="0 0 24 24"
  //                       >
  //                         <path
  //                           strokeLinecap="round"
  //                           strokeLinejoin="round"
  //                           strokeWidth={2}
  //                           d="M9 5l7 7-7 7"
  //                         />
  //                       </svg>
  //                     </span>
  //                   </div>
  //                 </Link>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </div>

  //       {/* Mobile/Tablet Grid View */}
  //       <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //           {plugins
  //             .slice()
  //             .sort((a, b) => b.downloads - a.downloads)
  //             .slice(0, 6)
  //             .map(plugin => (
  //               <Link
  //                 key={plugin.id}
  //                 href={`/marketplace/${plugin.slug}`}
  //                 className="relative group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-500/50"
  //               >
  //                 {/* Badge for pricing */}
  //                 <div className="absolute top-4 right-4">
  //                   {plugin.pricing.type === "free" ? (
  //                     <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">
  //                       {t("plugin.badge.free")}
  //                     </span>
  //                   ) : (
  //                     <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
  //                       ${plugin.pricing.amount}
  //                     </span>
  //                   )}
  //                 </div>

  //                 <div className="transition-all duration-300 group-hover:-translate-y-2">
  //                   {/* Icon */}
  //                   <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
  //                     {plugin.icon}
  //                   </div>

  //                   {/* Title */}
  //                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
  //                     {plugin.name}
  //                   </h3>

  //                   {/* Description */}
  //                   <p className="text-gray-300 text-sm mb-3 line-clamp-2">
  //                     {plugin.tagline}
  //                   </p>

  //                   {/* Stats */}
  //                   <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
  //                     <div className="flex items-center gap-1">
  //                       <svg
  //                         className="w-3 h-3 text-yellow-500"
  //                         fill="currentColor"
  //                         viewBox="0 0 20 20"
  //                       >
  //                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  //                       </svg>
  //                       <span>{plugin.rating}</span>
  //                     </div>
  //                     <div className="flex items-center gap-1">
  //                       <svg
  //                         className="w-3 h-3"
  //                         fill="none"
  //                         stroke="currentColor"
  //                         viewBox="0 0 24 24"
  //                       >
  //                         <path
  //                           strokeLinecap="round"
  //                           strokeLinejoin="round"
  //                           strokeWidth={2}
  //                           d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  //                         />
  //                       </svg>
  //                       <span>{plugin.downloads.toLocaleString()}</span>
  //                     </div>
  //                   </div>

  //                   {/* Category Badge */}
  //                   <div>
  //                     <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
  //                       {plugin.category}
  //                     </span>
  //                   </div>
  //                 </div>
  //               </Link>
  //             ))}
  //         </div>
  //       </div>
  //     </section>

  //     {/* Browse All Plugins Section */}
  //     <section className="relative pt-12 pb-20 overflow-hidden">
  //       <div className="absolute inset-0 z-0">
  //         <StarField density="medium" showComets={true} cometCount={3} />
  //         <GridLines />
  //       </div>

  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
  //         <div className="text-center mb-8">
  //           <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
  //             {t("browse.title")}
  //           </h2>
  //           <p className="text-gray-400">{t("browse.subtitle")}</p>
  //         </div>

  //         {/* Search and Filters */}
  //         <div className="mb-12">
  //           <div className="flex flex-col md:flex-row gap-4">
  //             {/* Search Bar */}
  //             <div className="flex-1 relative">
  //               <input
  //                 type="text"
  //                 placeholder={t("browse.searchPlaceholder")}
  //                 value={searchQuery}
  //                 onChange={e => setSearchQuery(e.target.value)}
  //                 className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
  //               />
  //               <svg
  //                 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 viewBox="0 0 24 24"
  //               >
  //                 <path
  //                   strokeLinecap="round"
  //                   strokeLinejoin="round"
  //                   strokeWidth={2}
  //                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  //                 />
  //               </svg>
  //             </div>

  //             {/* Category Filter */}
  //             <div className="relative" ref={categoryRef}>
  //               <button
  //                 onClick={() => {
  //                   setIsCategoryOpen(!isCategoryOpen);
  //                   setIsPricingOpen(false);
  //                 }}
  //                 className="w-full md:w-48 px-6 py-4 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:bg-gray-700/90 transition-all duration-200 shadow-lg flex items-center justify-between"
  //               >
  //                 <span>{selectedCategory}</span>
  //                 <svg
  //                   className={`w-5 h-5 transition-transform duration-200 ${
  //                     isCategoryOpen ? "rotate-180" : ""
  //                   }`}
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M19 9l-7 7-7-7"
  //                   />
  //                 </svg>
  //               </button>
  //               {isCategoryOpen && (
  //                 <div className="absolute z-50 mt-2 w-full md:w-64 bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 max-h-96 overflow-y-auto scrollbar-hide">
  //                   {categories.map(cat => (
  //                     <button
  //                       key={cat}
  //                       onClick={() => {
  //                         setSelectedCategory(cat);
  //                         setIsCategoryOpen(false);
  //                       }}
  //                       className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
  //                         selectedCategory === cat
  //                           ? "bg-purple-600/30 text-purple-300"
  //                           : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
  //                       }`}
  //                     >
  //                       {cat}
  //                     </button>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>

  //             {/* Pricing Filter */}
  //             <div className="relative" ref={pricingRef}>
  //               <button
  //                 onClick={() => {
  //                   setIsPricingOpen(!isPricingOpen);
  //                   setIsCategoryOpen(false);
  //                 }}
  //                 className="w-full md:w-48 px-6 py-4 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:bg-gray-700/90 transition-all duration-200 shadow-lg flex items-center justify-between"
  //               >
  //                 <span>
  //                   {selectedPricing === "All"
  //                     ? t("browse.pricingFilter.all")
  //                     : selectedPricing === "free"
  //                       ? t("browse.pricingFilter.free")
  //                       : selectedPricing === "monthly"
  //                         ? t("browse.pricingFilter.monthly")
  //                         : t("browse.pricingFilter.oneTime")}
  //                 </span>
  //                 <svg
  //                   className={`w-5 h-5 transition-transform duration-200 ${
  //                     isPricingOpen ? "rotate-180" : ""
  //                   }`}
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M19 9l-7 7-7-7"
  //                   />
  //                 </svg>
  //               </button>
  //               {isPricingOpen && (
  //                 <div className="absolute z-50 mt-2 w-full bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50">
  //                   {[
  //                     { value: "All", label: "All Pricing" },
  //                     { value: "free", label: "Free" },
  //                     { value: "monthly", label: "Monthly" },
  //                     { value: "one-time", label: "One-time" },
  //                   ].map(option => (
  //                     <button
  //                       key={option.value}
  //                       onClick={() => {
  //                         setSelectedPricing(option.value);
  //                         setIsPricingOpen(false);
  //                       }}
  //                       className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
  //                         selectedPricing === option.value
  //                           ? "bg-purple-600/30 text-purple-300"
  //                           : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
  //                       }`}
  //                     >
  //                       {option.label}
  //                     </button>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         </div>

  //         {/* Results Count */}
  //         <div className="mb-6">
  //           <p className="text-gray-400">
  //             {t("browse.showing")} {filteredPlugins.length} {t("browse.of")}{" "}
  //             {plugins.length} {t("browse.plugins")}
  //           </p>
  //         </div>

  //         {/* Plugin Grid */}
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
  //           {paginatedPlugins.map(plugin => (
  //             <div
  //               key={plugin.id}
  //               className="group bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
  //             >
  //               <div className="p-6">
  //                 {/* Plugin Icon & Name */}
  //                 <div className="flex items-start justify-between mb-4">
  //                   <div className="flex items-center gap-3">
  //                     <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
  //                       {plugin.icon}
  //                     </div>
  //                     <div>
  //                       <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
  //                         {plugin.name}
  //                       </h3>
  //                       <p className="text-sm text-gray-400">
  //                         v{plugin.version}
  //                       </p>
  //                     </div>
  //                   </div>
  //                 </div>

  //                 {/* Tagline */}
  //                 <p className="text-gray-300 mb-4 line-clamp-2">
  //                   {plugin.tagline}
  //                 </p>

  //                 {/* Category Badge */}
  //                 <div className="mb-4">
  //                   <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
  //                     {plugin.category}
  //                   </span>
  //                 </div>

  //                 {/* Stats */}
  //                 <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
  //                   <div className="flex items-center gap-1">
  //                     <svg
  //                       className="w-4 h-4 text-yellow-500"
  //                       fill="currentColor"
  //                       viewBox="0 0 20 20"
  //                     >
  //                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  //                     </svg>
  //                     <span>{plugin.rating}</span>
  //                   </div>
  //                   <div className="flex items-center gap-1">
  //                     <svg
  //                       className="w-4 h-4"
  //                       fill="none"
  //                       stroke="currentColor"
  //                       viewBox="0 0 24 24"
  //                     >
  //                       <path
  //                         strokeLinecap="round"
  //                         strokeLinejoin="round"
  //                         strokeWidth={2}
  //                         d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  //                       />
  //                     </svg>
  //                     <span>{plugin.downloads.toLocaleString()}</span>
  //                   </div>
  //                 </div>

  //                 {/* Pricing & CTA */}
  //                 <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
  //                   <div>
  //                     {plugin.pricing.type === "free" ? (
  //                       <span className="text-green-400 font-semibold">
  //                         {t("plugin.free")}
  //                       </span>
  //                     ) : (
  //                       <div>
  //                         <span className="text-white font-semibold text-lg">
  //                           ${plugin.pricing.amount}
  //                         </span>
  //                         <span className="text-gray-400 text-sm ml-1">
  //                           {plugin.pricing.type === "monthly"
  //                             ? t("plugin.monthly")
  //                             : t("plugin.oneTime")}
  //                         </span>
  //                       </div>
  //                     )}
  //                   </div>
  //                   <Link
  //                     href={`/marketplace/${plugin.slug}`}
  //                     className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
  //                   >
  //                     {t("plugin.viewDetails")}
  //                   </Link>
  //                 </div>
  //               </div>
  //             </div>
  //           ))}
  //         </div>

  //         {/* Pagination */}
  //         {filteredPlugins.length > 0 && totalPages > 1 && (
  //           <div className="flex justify-center items-center gap-2 mt-12">
  //             <button
  //               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
  //               disabled={currentPage === 1}
  //               className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all duration-300"
  //             >
  //               {t("browse.pagination.previous")}
  //             </button>

  //             <div className="flex gap-2">
  //               {Array.from({ length: totalPages }, (_, i) => i + 1).map(
  //                 page => (
  //                   <button
  //                     key={page}
  //                     onClick={() => setCurrentPage(page)}
  //                     className={`px-4 py-2 rounded-lg transition-all duration-300 ${
  //                       currentPage === page
  //                         ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
  //                         : "bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-700/50"
  //                     }`}
  //                   >
  //                     {page}
  //                   </button>
  //                 )
  //               )}
  //             </div>

  //             <button
  //               onClick={() =>
  //                 setCurrentPage(prev => Math.min(totalPages, prev + 1))
  //               }
  //               disabled={currentPage === totalPages}
  //               className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all duration-300"
  //             >
  //               {t("browse.pagination.next")}
  //             </button>
  //           </div>
  //         )}

  //         {/* No Results */}
  //         {filteredPlugins.length === 0 && (
  //           <div className="text-center py-20">
  //             <div className="text-6xl mb-4">🔍</div>
  //             <h3 className="text-2xl font-bold text-white mb-2">
  //               {t("browse.noResults.title")}
  //             </h3>
  //             <p className="text-gray-400">{t("browse.noResults.subtitle")}</p>
  //           </div>
  //         )}
  //       </div>
  //     </section>

  //     <Footer />
  //   </main>
  // );
}

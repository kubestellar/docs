"use client";

import { useState } from "react";
import { Download, Rocket, User } from "lucide-react";

import { TYPE_CONFIG } from "../lib/constants";
import type { MarketplaceItem } from "../lib/types";
import { InstallModal } from "./InstallModal";

export function MarketplaceCard({ item }: { item: MarketplaceItem }) {
  const [showInstall, setShowInstall] = useState(false);
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className="group bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-1 flex flex-col">
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
        <span className={`text-xs px-2 py-1 rounded-full border ${config.badge}`}>
          {config.label}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-3">
        {item.description}
      </p>

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

      {showInstall && (
        <InstallModal item={item} onClose={() => setShowInstall(false)} />
      )}
    </div>
  );
}

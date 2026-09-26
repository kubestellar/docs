"use client";

import { useTranslations } from "next-intl";

import type { Plugin } from "../../plugins";

export function PluginInstallModal({
  plugin,
  installedSuccess,
  onClose,
  t,
}: {
  plugin: Plugin;
  installedSuccess: boolean;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {!installedSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t("installation.installing", { name: plugin.name })}
            </h3>
            <p className="text-gray-400">{t("installation.pleaseWait")}</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t("installation.success.title")}
            </h3>
            <p className="text-gray-400 mb-6">
              {t("installation.success.subtitle", { name: plugin.name })}
            </p>
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">
                {t("installation.success.commandTitle")}
              </p>
              <code className="text-purple-400 text-sm block break-all">
                kubectl ks plugin enable {plugin.slug}
              </code>
            </div>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
            >
              {t("installation.success.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

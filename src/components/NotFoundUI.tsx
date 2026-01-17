"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFoundUI() {
  const t = useTranslations("notFound");

  return (
    <section className="px-4 py-32 sm:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          {t("title")}
        </div>

        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
          404
        </h1>

        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
          {t("description")}
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            {t("homeButton")}
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
          >
            {t("docsButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}

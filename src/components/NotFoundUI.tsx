"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFoundUI() {
  const t = useTranslations("notFound");

  return (
    <section className="px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-8xl font-bold mb-8">
          <span className="block text-gradient-animated">404</span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          {t("description")}
        </p>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-16">
          {t("message")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-[#3b82f6] rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            {t("homeButton")}
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
          >
            {t("docsButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}

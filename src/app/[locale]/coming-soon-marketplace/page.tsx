"use client";

import { useTranslations } from "next-intl";
import { ComingSoonCTA } from "@/components";
import ComingSoonHero from "@/components/ComingSoonHero";
import PageShell from "@/components/master-page/PageShell";

export default function ComingSoonPage() {
  const t = useTranslations("comingSoonPage");

  return (
    <PageShell>
      <ComingSoonHero>
        {/* Demo Video Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="text-gradient">{t("demoTitle")}</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                {t("demoSubtitle")}
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 bg-gray-900/50 backdrop-blur-sm">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/ZmuvEQJn98U?si=87ivMCi58ZKY3TBh"
                  title="Marketplace Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      </ComingSoonHero>

      {/* Call to Action */}
      <ComingSoonCTA />
    </PageShell>
  );
}

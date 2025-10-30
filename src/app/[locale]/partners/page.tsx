"use client";

import { GridLines, StarField } from "../../../components/index";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";
import { useTranslations } from "next-intl";
import GetStartedSection from "@/components/master-page/GetStartedSection";
import Link from "next/link";
import Image from "next/image";

export default function PartnersPage() {
  const t = useTranslations("partnersPage");

  const partners = [
    {
      id: 1,
      name: "ArgoCD",
      slug: "argocd",
      description: t("partners.argocd.description"),
      logo: "/partners/argocd.png",
      link: "https://argo-cd.readthedocs.io/",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      id: 2,
      name: "FluxCD",
      slug: "fluxcd",
      description: t("partners.fluxcd.description"),
      logo: "/partners/fluxcd.png",
      link: "https://fluxcd.io/",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      id: 3,
      name: "Kyverno",
      slug: "kyverno",
      description: t("partners.kyverno.description"),
      logo: "/partners/kyverno.png",
      link: "https://kyverno.io/",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      id: 4,
      name: "Mvi",
      slug: "mvi",
      description: t("partners.mvi.description"),
      logo: "/partners/mvi.png",
      link: "/",
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
    {
      id: 5,
      name: "OpenZiti",
      slug: "openziti",
      description: t("partners.openziti.description"),
      logo: "/partners/openziti.png",
      link: "https://openziti.io/",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
    },
    {
      id: 6,
      name: "Turbonomic",
      slug: "turbonomic",
      description: t("partners.turbonomic.description"),
      logo: "/partners/turbonomic.webp",
      link: "https://www.ibm.com/products/turbonomic",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
    },
  ];

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen">
      <Navigation />

      {/* Full page background with starfield */}
      <div className="fixed inset-0 z-0">
        {/* Dark base background */}
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>

        {/* Starfield background */}
        <StarField density="medium" showComets={true} cometCount={3} />

        {/* Grid lines background */}
        <GridLines horizontalLines={21} verticalLines={18} />
      </div>

      <div className="relative z-10 pt-16">
        {" "}
        {/* Add padding-top to account for fixed navbar */}
        {/* Header Section */}
        <section className="py-16 sm:py-20 lg:py-24 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {t("title")}{" "}
                <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
                  {t("titleSpan")}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </section>
        {/* Partners Grid Section */}
        <section className="py-4 sm:py-8 md:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map(partner => (
                <Link
                  key={partner.id}
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group bg-slate-800/50 border border-slate-700 rounded-xl p-10 h-96 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/30"
                >
                  <div className="transition-all duration-300 group-hover:-translate-y-2 h-full flex flex-col">
                    <div className="mb-6">
                      <Image
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        width={partner.slug === "argocd" ? 100 : 96}
                        height={partner.slug === "argocd" ? 100 : 96}
                        className={`${partner.slug === "argocd" ? "w-[100px] h-[100px]" : "w-24 h-24"} object-contain ${partner.slug === "mvi" || partner.slug === "turbonomic" ? "bg-white rounded-lg p-2" : ""}`}
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-5">
                      {partner.name}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-base flex-grow">
                      {partner.description}
                    </p>
                  </div>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="learn-more-enhanced">
                      {t("learnMore")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        {/* Why Partner With Us Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-8 md:p-12 border border-white/10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
                {t("whyPartner.title")}
              </h2>
              <p className="text-gray-300 text-center mb-12 text-lg max-w-3xl mx-auto">
                {t("whyPartner.subtitle")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {t("whyPartner.benefits.0.title")}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t("whyPartner.benefits.0.description")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {t("whyPartner.benefits.1.title")}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t("whyPartner.benefits.1.description")}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {t("whyPartner.benefits.2.title")}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {t("whyPartner.benefits.2.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Ready To Get Started Section */}
        <GetStartedSection />
      </div>
      <Footer />
    </div>
  );
}

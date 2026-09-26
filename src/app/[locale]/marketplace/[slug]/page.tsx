"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Footer, Navbar } from "@/components";

import { usePlugins } from "../plugins";
import { PluginDetailSections } from "./components/PluginDetailSections";
import { PluginInstallModal } from "./components/PluginInstallModal";
import { PluginPaymentModal } from "./components/PluginPaymentModal";

export default function PluginDetailPage() {
  const t = useTranslations("marketplace");
  const plugins = usePlugins();
  const params = useParams();
  const slug = params.slug as string;

  const plugin = plugins.find((p) => p.slug === slug);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plugin) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t("plugin.notFound.title")}
          </h1>
          <Link
            href="/marketplace"
            className="text-purple-400 hover:text-purple-300"
          >
            ← {t("plugin.backToMarketplace")}
          </Link>
        </div>
      </main>
    );
  }

  const handleInstall = () => {
    if (plugin.pricing.type !== "free") {
      setShowPaymentModal(true);
    } else {
      setShowInstallModal(true);
      setTimeout(() => {
        setInstalledSuccess(true);
      }, 2000);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPaymentSuccess(true);
      setIsProcessing(false);
      setTimeout(() => {
        setShowPaymentModal(false);
        setShowInstallModal(true);
        setTimeout(() => {
          setInstalledSuccess(true);
        }, 2000);
      }, 1500);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <PluginDetailSections plugin={plugin} onInstall={handleInstall} t={t} />

      <Footer />

      {showPaymentModal && (
        <PluginPaymentModal
          plugin={plugin}
          paymentSuccess={paymentSuccess}
          isProcessing={isProcessing}
          onClose={() => setShowPaymentModal(false)}
          onPayment={handlePayment}
          t={t}
        />
      )}

      {showInstallModal && (
        <PluginInstallModal
          plugin={plugin}
          installedSuccess={installedSuccess}
          onClose={() => {
            setShowInstallModal(false);
            setInstalledSuccess(false);
            setPaymentSuccess(false);
          }}
          t={t}
        />
      )}
    </main>
  );
}

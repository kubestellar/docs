"use client";

import { useEffect, useState } from "react";
import { Link as IntlLink } from "@/i18n/navigation";
import { GridLines, StarField, GlobeAnimation } from "../index";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("heroSection");
  const [copied, setCopied] = useState(false);

  const installScript = `curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash`; 

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  useEffect(() => {
    // Enhanced typing animation for terminal
    const initTypingAnimation = () => {
      const typingText = document.querySelector(".typing-text") as HTMLElement;
      const commandResponse = document.querySelector(
        ".command-response"
      ) as HTMLElement;

      if (typingText && commandResponse) {
        const text = typingText.textContent || "";
        typingText.textContent = "";

        let i = 0;
        const typeInterval = setInterval(() => {
          if (i < text.length) {
            typingText.textContent += text.charAt(i);
            i++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => {
              commandResponse.style.opacity = "1";
            }, 500);
          }
        }, 50);
      }
    };

    // Animated counters
    const animateCounters = () => {
      const counters = document.querySelectorAll(".counter");
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute("data-target") || "0");
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = Math.floor(current).toString();
        }, 16);
      });
    };

    // Initialize components
    initTypingAnimation();
    animateCounters();
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white min-h-[100vh] flex items-center">
      {/* Animated Background Universe */}
      <div className="absolute inset-0 z-0">
        {/*!-- Floating Nebula Clouds */}
        {/* Dynamic Star Field */}
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <StarField density="medium" showComets={true} cometCount={8} />
        </div>

        {/* Interactive Grid Network */}
        <div className="absolute inset-0">
          <GridLines verticalLines={15} horizontalLines={18} />
        </div>

        {/* Floating Data Particles */}
        <div className="absolute inset-0">
          <div
            className="data-particle"
            style={{ "--delay": "0s" } as React.CSSProperties}
          ></div>
          <div
            className="data-particle"
            style={{ "--delay": "1s" } as React.CSSProperties}
          ></div>
          <div
            className="data-particle"
            style={{ "--delay": "2s" } as React.CSSProperties}
          ></div>
          <div
            className="data-particle"
            style={{ "--delay": "3s" } as React.CSSProperties}
          ></div>
          <div
            className="data-particle"
            style={{ "--delay": "4s" } as React.CSSProperties}
          ></div>
          <div
            className="data-particle"
            style={{ "--delay": "5s" } as React.CSSProperties}
          ></div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Full-width Title */}
        <div className="heading-container mb-8 lg:mb-12 pt-8 md:pt-0">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none">
            {/* First Line */}
            <span className="block text-white mb-3 animate-text-reveal pt-5">
              <span className="text-gradient">{t("line1")}</span>
            </span>

            {/* Second Line with delay */}
            <span className="block animate-text-reveal">
              <span className="text-gradient-animated">{t("line2")}</span>
            </span>

            {/* Third Line with longer delay */}
            <span className="block animate-text-reveal [animation-delay:0.4s]">
              <span className="text-gradient-animated">{t("line3")}</span>
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Interactive Content */}
          <div className="hero-content space-y-6 sm:space-y-8 lg:space-y-12 flex flex-col justify-center lg:block">

            {/* Paragraph with fade-in-up effect and delay */}
            <p className="sm:text-xl text-gray-300 max-w-2xl leading-snug animate-fade-in-up opacity-0 [animation-delay:0.6s] [animation-fill-mode:forwards]">
              {t("subtitle")}
            </p>

            {/* Get Started Heading */}
            <h3 className="text-xl font-bold text-white">
              Get Started with{" "}
              <span className="text-gradient animated-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                KubeStellar Console
              </span>
            </h3>

            {/* Install Command */}
            <div className="command-center-container">
              <div className="bg-black/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-2xl animate-command-glow">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-blue-300 leading-relaxed overflow-x-auto">
                    <span className="text-green-400 mr-2">$</span>
                    curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash
                  </div>
                  <button
                    onClick={handleCopy}
                    className="copy-button ml-4 rounded-md p-2 flex-shrink-0 transition-all duration-200"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-sky-400 hover:text-sky-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Console Docs Link */}
            <div className="mt-4 animate-btn-float" style={{ animationDelay: "0.8s" }}>
              <IntlLink
                href="/docs/console/readme"
                className="inline-flex items-center text-lg text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                
                <svg
                   className="mr-2 h-4 w-4"
                   fill="none"
                   viewBox="0 0 24 24"
                   stroke="currentColor"
                >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                   ></path>
                </svg>
                Console Documentation
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </IntlLink>
            </div>
          </div>

          {/* Right Column: Globe Animation */}
          <div className="globe-animation-container relative h-[500px] flex items-center justify-center">
            <GlobeAnimation
              width="100%"
              height="600px"
              className="rounded-xl overflow-hidden"
              showLoader={true}
              enableControls={true}
              enablePan={false}
              autoRotate={true}
              style={{
                filter: "drop-shadow(0 25px 50px rgba(59, 130, 246, 0.3))",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

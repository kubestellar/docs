"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { useTranslations } from "next-intl";

interface NavbarLogoProps {
  t: ReturnType<typeof useTranslations>;
  children?: React.ReactNode;
}

/**
 * Renders the KubeStellar logo plus the primary center nav links
 * (Docs, Live Demo, Marketplace). Dropdown menus are rendered via
 * `children` so the DOM structure matches the original inline markup.
 */
export default function NavbarLogo({ t, children }: NavbarLogoProps) {
  return (
    <>
                  {/* Left side: Logo */}
            <Link href="/" className="cursor-pointer">
              <div className="flex-shrink-0 cursor-pointer relative z-10">
                <Image
                  src="/KubeStellar-with-Logo-transparent.png"
                  alt="Kubestellar logo"
                  width={160}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </div>
            </Link>

      {/* Center: Nav Links */}
      <div className="hidden lg:flex flex-1 justify-center">
        <div className="flex items-center space-x-8">
                {/* Docs Link */}
                <div className="relative group">
                  <Link
                    href="/docs"
                    className="text-sm font-medium text-gray-300 hover:text-blue-400 transition-all duration-300 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 nav-link-hover"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 transition-all duration-300 group-hover:scale-102"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                    </div>
                    <span>{t("docs")}</span>
                  </Link>
                </div>

                {/* Live Demo Link */}
                <div className="relative group">
                  <a
                    href="https://console.kubestellar.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-300 hover:text-orange-400 transition-all duration-300 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 transform nav-link-hover"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 transition-all duration-300 group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          className="group-hover:stroke-[2.5] transition-all duration-300"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          className="group-hover:stroke-[2.5] transition-all duration-300"
                        ></path>
                      </svg>
                    </div>
                    <span>{t("liveDemo")}</span>
                  </a>
                </div>

                {/* Marketplace Link */}
                <div className="relative group">
                  <Link
                    href="/marketplace"
                    className="text-sm font-medium text-gray-300 hover:text-pink-400 transition-all duration-300 flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-pink-500/10 hover:shadow-lg hover:shadow-pink-500/20 transform nav-link-hover"
                  >
                    <div className="relative">
                      <svg
                        className="w-5 h-5 transition-all duration-300 group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        ></path>
                      </svg>
                    </div>
                    <span>{t("marketplace")}</span>
                  </Link>
                </div>
          {children}
        </div>
      </div>
    </>
  );
}

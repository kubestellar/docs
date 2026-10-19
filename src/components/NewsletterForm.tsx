"use client";

import { FormEvent } from "react";

export interface NewsletterFormProps {
  email: string;
  setEmail: (email: string) => void;
  handleSubscribe: (e: FormEvent) => void;
  title: string;
  emailPlaceholder: string;
  subscribeLabel: string;
  /**
   * Whether to render the dark-theme classes. Defaults to true to match the
   * marketing-site Footer, which has no light mode. DocsFooter passes its
   * own light/dark flag through.
   */
  isDark?: boolean;
}

/**
 * NewsletterForm renders the footer newsletter-subscribe markup (title,
 * email input with icon, submit button) shared verbatim by Footer.tsx and
 * DocsFooter.tsx. Extracted alongside useNewsletterSubscribe, which already
 * owns the email state and submit handler these two components share.
 */
export default function NewsletterForm({
  email,
  setEmail,
  handleSubscribe,
  title,
  emailPlaceholder,
  subscribeLabel,
  isDark = true,
}: NewsletterFormProps) {
  return (
    <div className="flex flex-col items-center md:items-end justify-center w-full mb-6 sm:mb-8">
      <div className="w-full max-w-3xl lg:pr-28">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between lg:pl-12 gap-4 mb-4">
          {/* Title */}
          <div className="flex items-center justify-center w-full md:w-auto text-center md:text-left">
            <h3
              className={`text-sm sm:text-sm md:text-base font-semibold uppercase tracking-wide whitespace-nowrap ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
          </div>

          {/* Form container */}
          <div className="flex-1 w-full md:w-auto">
            <form
              id="newsletter-form"
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto"
            >
              <div className="relative flex-1 w-full min-w-[260px] sm:min-w-[280px] md:min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <input
                  id="email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    isDark
                      ? "text-white placeholder-gray-400 bg-gray-700/50 border-gray-600"
                      : "text-gray-900 placeholder-gray-500 bg-white border-gray-300"
                  }`}
                  placeholder={emailPlaceholder}
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap ${
                  isDark ? "focus:ring-offset-gray-800" : "focus:ring-offset-white"
                }`}
              >
                <span>{subscribeLabel}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

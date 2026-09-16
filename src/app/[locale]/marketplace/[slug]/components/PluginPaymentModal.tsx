"use client";

import { useTranslations } from "next-intl";

import type { Plugin } from "../../plugins";

export function PluginPaymentModal({
  plugin,
  paymentSuccess,
  isProcessing,
  onClose,
  onPayment,
  t,
}: {
  plugin: Plugin;
  paymentSuccess: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onPayment: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {!paymentSuccess ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t("payment.title")}
              </h3>
              <p className="text-gray-400">
                {t("payment.subtitle", { name: plugin.name })}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">
                  {t("payment.details.plugin")}
                </span>
                <span className="text-white font-semibold">
                  {plugin.name}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">
                  {t("payment.details.licenseType")}
                </span>
                <span className="text-white capitalize">
                  {plugin.pricing.type}
                </span>
              </div>
              <div className="border-t border-gray-700/50 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">
                  {t("payment.details.total")}
                </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ${plugin.pricing.amount}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("payment.form.cardNumber")}
                </label>
                <input
                  type="text"
                  placeholder={t("payment.form.cardPlaceholder")}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t("payment.form.expiry")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("payment.form.expiryPlaceholder")}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t("payment.form.cvv")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("payment.form.cvvPlaceholder")}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {t("payment.form.cancel")}
              </button>
              <button
                onClick={onPayment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("payment.form.processing")}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("payment.form.payNow")}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              {t("payment.form.secureNote")}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
              {t("payment.success.title")}
            </h3>
            <p className="text-gray-400 mb-4">
              {t("payment.success.subtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

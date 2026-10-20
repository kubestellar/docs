"use client";

/**
 * Floating "back to top" button shared by the marketing {@link Footer} and
 * {@link DocsFooter}. The two footers previously carried a byte-identical
 * copy of this button+icon markup (including the `#back-to-top` id that
 * `useBackToTop` queries for); only the accessible label differs between
 * the two (translated vs. a plain English literal), so it's the one prop
 * this component takes.
 */
export interface BackToTopButtonProps {
  ariaLabel: string;
}

export default function BackToTopButton({ ariaLabel }: BackToTopButtonProps) {
  return (
    <button
      id="back-to-top"
      className="fixed bottom-18 right-8 p-3 rounded-full bg-blue-600 text-white shadow-lg z-40 transition-all duration-300 opacity-0 translate-y-10 hover:bg-blue-700 hover:scale-110"
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}

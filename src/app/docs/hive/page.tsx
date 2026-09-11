import type { Metadata } from 'next'

const HIVE_HOME = 'https://hive.hivecommons.dev'
const HIVE_DOCS = 'https://docs.hivecommons.dev/docs/hive/overview/introduction'

export const metadata: Metadata = {
  title: 'Looking for Hive?',
  description:
    'Hive has moved to its own home at hivecommons. The Hive documentation is now published at docs.hivecommons.dev and is no longer available on docs.kubestellar.io.',
  alternates: {
    canonical: '/docs/hive',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function HiveMovedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mb-4 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
        Documentation moved
      </p>

      <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
        Looking for Hive?
      </h1>

      <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        Hive now lives in its own home, along with the rest of the Hive Commons
        projects. Its documentation has moved to docs.hivecommons.dev and is no
        longer published here on docs.kubestellar.io.
      </p>

      <a
        href={HIVE_DOCS}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Take me to the Hive docs
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H18v4.5M17.25 6.75 10.5 13.5M15 15.75V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18v-7.5A1.5 1.5 0 0 1 6 9h2.25"
          />
        </svg>
      </a>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Project home:{' '}
        <a
          href={HIVE_HOME}
          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          hive.hivecommons.dev
        </a>
      </p>
    </div>
  )
}

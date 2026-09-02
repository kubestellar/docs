/**
 * Minimal structured logger for API route handlers.
 *
 * Emits single-line JSON to stdout/stderr so log aggregators (Netlify
 * function logs, the Docker runtime's stdout, etc.) can parse fields
 * without a bundled logging backend or external exporter. Fields are a
 * fixed, bounded set — never spread arbitrary/user-controlled objects
 * into the record, to avoid unbounded cardinality or leaking request
 * bodies/query content into logs.
 */

export type LogFields = {
  route: string
  method?: string
  status?: number
  durationMs?: number
  error?: string
}

function write(level: "info" | "error", message: string, fields: LogFields) {
  const record = {
    level,
    time: new Date().toISOString(),
    message,
    ...fields,
  }
  const line = JSON.stringify(record)
  // Repo lint policy only allows console.warn/console.error (no-console), so
  // info-level records are emitted via console.warn rather than console.log.
  if (level === "error") {
    console.error(line)
  } else {
    console.warn(line)
  }
}

export const logger = {
  info(message: string, fields: LogFields) {
    write("info", message, fields)
  },
  /** Truncates `error` to keep log lines bounded (no stack traces / raw payloads). */
  error(message: string, fields: LogFields) {
    const truncated =
      fields.error && fields.error.length > 300
        ? `${fields.error.slice(0, 300)}...`
        : fields.error
    write("error", message, { ...fields, error: truncated })
  },
}

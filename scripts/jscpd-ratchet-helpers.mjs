/**
 * Pure decision logic extracted from scripts/jscpd-ratchet.mjs so the
 * ratchet's pass/fail/notice branches can be unit-tested independently of
 * the jscpd subprocess call and filesystem I/O in the runner.
 *
 * See scripts/jscpd-ratchet-helpers.test.mjs for the contract this function
 * must uphold.
 */

/**
 * Decide the ratchet outcome for a given clone count against the committed
 * baseline.
 *
 * @param {number} clones - clone count from the jscpd report just produced.
 * @param {number} baselineClones - "clones" value from jscpd-baseline.json.
 * @returns {{ ok: boolean, logLines: string[], errorLine: string | null }}
 *   ok: false means the CLI should exit non-zero (duplication grew).
 *   logLines: messages to print via console.log, in order.
 *   errorLine: an "::error::..." line to print via console.error, or null
 *     when the ratchet passes.
 */
export function evaluateRatchet(clones, baselineClones) {
  const logLines = [`\njscpd ratchet: ${clones} clone(s) found, baseline ${baselineClones}`];

  if (clones > baselineClones) {
    return {
      ok: false,
      logLines,
      errorLine: `::error::Duplication increased: ${clones} clones > baseline ${baselineClones}. Remove the new duplication (see clones above).`,
    };
  }

  if (clones < baselineClones) {
    logLines.push(
      `::notice::Duplication decreased; lower "clones" in jscpd-baseline.json to ${clones} in this PR to ratchet.`,
    );
  }

  return { ok: true, logLines, errorLine: null };
}

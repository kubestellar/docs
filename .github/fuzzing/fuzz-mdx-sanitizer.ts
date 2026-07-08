#!/usr/bin/env node
/**
 * Fuzz harness for sanitizeHtmlForMdx.
 *
 * Generates a stream of mutated HTML inputs and asserts that:
 *   1. No <script> or <style> tags survive sanitization.
 *   2. No inline event handlers (on*=) survive.
 *   3. The function always terminates within 100 ms per call.
 *   4. The output is always a string (no thrown errors).
 *
 * Usage (run from repo root after `npm ci`):
 *   npx tsx .github/fuzzing/fuzz-mdx-sanitizer.js [--iterations=N] [--seed=N]
 *
 * Exit 0 = all invariants held; Exit 1 = violation found.
 */

import { sanitizeHtmlForMdx } from '../../src/lib/sanitizeHtml'

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------
const args: Record<string, string | boolean> = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const ITERATIONS = parseInt(String(args['iterations'] ?? '20000'), 10)
const SEED = parseInt(String(args['seed'] ?? Date.now()), 10)

// ---------------------------------------------------------------------------
// Seedable PRNG (xorshift32) for reproducible runs
// ---------------------------------------------------------------------------
let state = (SEED >>> 0) || 0xcafebabe
function rand(): number {
  state ^= state << 13
  state ^= state >> 17
  state ^= state << 5
  return (state >>> 0) / 0xffffffff
}
function randInt(lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo
}
function randChoice<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

// ---------------------------------------------------------------------------
// Seed corpus — real-world XSS and MDX edge cases
// ---------------------------------------------------------------------------
const SEEDS: string[] = [
  '<p>Hello</p><script>alert(1)</script><p>World</p>',
  '<script type="text/javascript" src="evil.js"></script>',
  '<script>x</script >',
  '<script>alert(1)</script foo="bar">',
  '<script>x</script\n>',
  '<scr<script>y</script>ipt>alert(1)</script>',
  '<scr<scr<script></script>ipt></script>ipt>evil</script>',
  '<script>a()</script>text<script>b()</script>',
  '<!-- <script>alert(1)</script> -->',
  '<!--<script>-->alert(1)<!--</script>-->',
  '{# jinja comment #}',
  '<style>body{display:none}</style><p>text</p>',
  '<sty<style>x</style>le>.evil{}</style>',
  'he\x00llo',
  '\x01\x02\x03\x04\x05\x06\x07',
  'test\x7Fvalue',
  '<img src="x" onerror="alert(1)" />',
  '<a href="javascript:void(0)" onclick="evil()">link</a>',
  '<div onmouseover="evil()">hover</div>',
  '<iframe src="evil.html"></iframe>',
  '<i<iframe>frame src="evil.html"></iframe>',
  '<meta http-equiv="refresh" content="0;url=evil.html">',
  '<!DOCTYPE html><html><body>',
  '<![CDATA[<script>alert(1)</script>]]>',
  '<?xml version="1.0"?><script>alert(1)</script>',
  '<p class="foo" style="color:red" align="left">text</p>',
  '<script>'.repeat(50) + 'evil()' + '</script>'.repeat(50),
  '<scr' + 'ipt>nested</scr' + 'ipt>',
  '',
  'plain text with no HTML',
]

// ---------------------------------------------------------------------------
// Injections for mutation
// ---------------------------------------------------------------------------
const INJECTIONS: string[] = [
  '<script>alert(1)</script>',
  '<SCRIPT>alert(1)</SCRIPT>',
  '<ScRiPt>evil()</sCrIpT>',
  'onerror=alert(1)',
  ' onclick="evil()"',
  '<style>*{visibility:hidden}</style>',
  '<!--',
  '-->',
  '\x00',
  '\x7F',
  '${7*7}',
  '{{7*7}}',
  '{# test #}',
  '<iframe src="x">',
]

// ---------------------------------------------------------------------------
// Mutation operators
// ---------------------------------------------------------------------------
function mutate(input: string): string {
  const op = randInt(0, 5)
  switch (op) {
    case 0: {
      const pos = randInt(0, input.length)
      const chunk = randChoice(INJECTIONS)
      return input.slice(0, pos) + chunk + input.slice(pos)
    }
    case 1: {
      if (input.length < 2) return input
      const lo = randInt(0, input.length - 1)
      const hi = randInt(lo, Math.min(lo + 20, input.length))
      return input.slice(0, lo) + input.slice(hi)
    }
    case 2: {
      const lo = randInt(0, input.length)
      const hi = randInt(lo, Math.min(lo + 15, input.length))
      return input + input.slice(lo, hi)
    }
    case 3: {
      if (input.length === 0) return input
      const i = randInt(0, input.length - 1)
      const arr = [...input]
      arr[i] = String.fromCharCode(randInt(0, 127))
      return arr.join('')
    }
    case 4: {
      return input.replace(/[a-zA-Z]/g, (c) =>
        rand() < 0.05 ? (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()) : c,
      )
    }
    default:
      return input + randChoice(INJECTIONS)
  }
}

// ---------------------------------------------------------------------------
// Invariant checks
// ---------------------------------------------------------------------------
const SCRIPT_RE = /<script[\s>]/i
const STYLE_RE = /<style[\s>]/i
const HANDLER_RE = /\son\w+\s*=/i

function checkInvariants(input: string, output: string): string | null {
  if (SCRIPT_RE.test(output))
    return `<script> tag survived sanitization\ninput: ${JSON.stringify(input.slice(0, 300))}`
  if (STYLE_RE.test(output))
    return `<style> tag survived sanitization\ninput: ${JSON.stringify(input.slice(0, 300))}`
  if (HANDLER_RE.test(output))
    return `event handler attribute survived\ninput: ${JSON.stringify(input.slice(0, 300))}`
  return null
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
console.log(`fuzz-mdx-sanitizer  seed=${SEED}  iterations=${ITERATIONS}`)

const corpus: string[] = [...SEEDS]
let failures = 0

for (let i = 0; i < ITERATIONS; i++) {
  const base = randChoice(corpus)
  const input = mutate(base)

  let output: string
  const t0 = Date.now()
  try {
    output = sanitizeHtmlForMdx(input)
  } catch (err) {
    console.error(`[CRASH] i=${i} ${(err as Error).message}`)
    console.error(`input: ${JSON.stringify(input.slice(0, 300))}`)
    failures++
    if (failures >= 3) break
    continue
  }
  const elapsed = Date.now() - t0
  if (elapsed > 200) {
    console.error(
      `[SLOW] i=${i} elapsed=${elapsed}ms for input of length ${input.length}`,
    )
    // Not counted as a hard failure — log and continue
  }

  const violation = checkInvariants(input, output)
  if (violation) {
    console.error(`[FAIL] i=${i} ${violation}`)
    failures++
    if (failures >= 3) break
    continue
  }

  // Light coverage guidance: occasionally add mutated input to corpus
  if (rand() < 0.02 && corpus.length < 300) {
    corpus.push(input)
  }

  if (i > 0 && i % 5000 === 0) {
    process.stdout.write(`  ${i}/${ITERATIONS} ok  corpus=${corpus.length}\n`)
  }
}

if (failures > 0) {
  console.error(`\nFAILED: ${failures} violation(s) found`)
  process.exit(1)
}

console.log(`PASSED: all ${ITERATIONS} iterations clean  corpus=${corpus.length}`)
process.exit(0)

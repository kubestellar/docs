// Preloaded via NODE_OPTIONS in the `test` script (applies to every vitest
// worker process, which `setupFiles` does not — jsdom loads during worker
// startup, before setup files run).
//
// jsdom >= 26 subclasses the ES2025 `Iterator` global
// (lib/jsdom/living/helpers/dom-tree.js), which only exists natively in
// Node >= 22. The prow presubmit image runs Node 20, so without this
// polyfill every jsdom-environment worker crashes at startup with
// "ReferenceError: Iterator is not defined" (74 unhandled errors) even
// though all tests pass. See kubestellar/docs issue 7354.
//
// core-js installs a constructible `Iterator` with the iterator-helpers
// prototype methods; on Node >= 22 the native implementation is kept.
if (typeof globalThis.Iterator === 'undefined') {
  require('core-js/actual/iterator')

  // jsdom >= 30 also reads every JS global out of the fresh vm context it
  // creates per window (lib/jsdom/browser/Window.js: vm.runInContext(name,
  // window) for each host global it found, which now includes our polyfilled
  // `Iterator`). A fresh context on Node 20 has no native Iterator, so window
  // creation throws "ReferenceError: Iterator is not defined" from inside
  // runInContext. Mirror the polyfilled Iterator into every new context.
  const vm = require('vm')
  const originalCreateContext = vm.createContext
  vm.createContext = function (...args) {
    const context = originalCreateContext.apply(this, args)
    // createContext returns the contextified object (or the context's global
    // object with DONT_CONTEXTIFY); property sets on it reflect as globals
    // inside the context.
    const globalObject =
      context !== null && typeof context === 'object' ? context : args[0]
    try {
      if (
        globalObject &&
        vm.runInContext('typeof Iterator', globalObject) === 'undefined'
      ) {
        globalObject.Iterator = globalThis.Iterator
      }
    } catch {
      // Non-contextified or frozen targets: leave untouched.
    }
    return context
  }
}

// The `test` script preloads this file with a cwd-relative path
// (`--require ./scripts/node-iterator-polyfill.cjs`). Node resolves that
// against the cwd of EACH process, so a child `node` process a test spawns
// with a tmpdir cwd dies at startup with MODULE_NOT_FOUND before running
// anything. Rewrite NODE_OPTIONS to this file's absolute path so inherited
// environments keep working from any cwd.
const RELATIVE_SPEC = './scripts/node-iterator-polyfill.cjs'
if (
  process.env.NODE_OPTIONS &&
  process.env.NODE_OPTIONS.includes(RELATIVE_SPEC) &&
  !__filename.includes(' ')
) {
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS
    .split(RELATIVE_SPEC)
    .join(__filename)
}

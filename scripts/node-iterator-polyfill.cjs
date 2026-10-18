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
}

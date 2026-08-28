import { describe, it, expect } from 'vitest'
import { getVersionFromBranch } from '../config/versions'

// Regression guard for the previously-uncovered arm[1] of the
// short-circuit OR in getVersionFromBranch (src/config/versions.ts
// line 599):
//
//   if (value.branch === branch || key === versionNum) {
//     return key as VersionKey
//   }
//
// The existing tests all resolve via arm[0] (value.branch === branch)
// because the canonical form ``docs/<VERSION>`` matches whichever
// version entry declares that branch. The arm[1] short-circuit —
// where the branch string does NOT match any recorded ``value.branch``
// but the trailing ``versionNum`` DOES equal a version-map KEY —
// is a real code path used when a caller passes ``docs/<KEY>``
// (e.g. ``docs/main`` or ``docs/latest``) that doesn't correspond
// to any actual branch checkout on GitHub. Without this test a
// regression that inverted the OR or dropped the key-match arm
// would silently make ``docs/main`` resolve to null.
describe('getVersionFromBranch — key-name fallback branch', () => {
  it('resolves docs/main via key equality (arm[1] of the OR)', () => {
    // The KUBESTELLAR_VERSIONS entry for key ``main`` has
    // ``branch: "main"`` — NOT ``"docs/main"`` — so arm[0]
    // (value.branch === "docs/main") is false for every entry.
    // The only reason this returns ``"main"`` is arm[1] firing on
    // ``key === "main"``.
    expect(getVersionFromBranch('docs/main')).toBe('main')
  })

  it('resolves docs/latest via key equality (arm[1] of the OR)', () => {
    // Same reasoning: no version entry has branch "docs/latest"
    // (``latest`` has branch "docs/0.30.0"), so this must resolve
    // via the key === versionNum arm.
    expect(getVersionFromBranch('docs/latest')).toBe('latest')
  })

  it('returns null for docs/<unknown-key>', () => {
    // Neither arm should fire: no value.branch equals
    // ``docs/definitely-not-a-key`` and no key equals
    // ``definitely-not-a-key``. Confirms the fall-through null
    // stays reachable when both OR arms are false — otherwise a
    // regression that always returned a first-match key would
    // silently succeed here.
    expect(getVersionFromBranch('docs/definitely-not-a-key')).toBeNull()
  })
})

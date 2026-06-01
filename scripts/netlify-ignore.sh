#!/bin/bash
# Netlify ignore script — exit 0 to skip build, exit 1 to build.
#
# Skip deploy preview builds for hive snapshot PR branches.
# Production builds on main always proceed (snapshot HTML must be deployed).

set -euo pipefail

# Skip deploy previews for snapshot PR branches
if echo "${BRANCH:-}" | grep -q '^chore/hive-snapshot'; then
  echo "Skipping: hive snapshot deploy preview branch"
  exit 0
fi

# All other cases: build
exit 1

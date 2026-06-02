#!/bin/bash
# Netlify ignore script — exit 0 to skip build, exit 1 to build.
# Skips builds for hive snapshot branches (any Netlify context).

echo "[netlify-ignore] BRANCH=$BRANCH HEAD=$HEAD PULL_REQUEST=$PULL_REQUEST REVIEW_ID=$REVIEW_ID COMMIT_REF=$COMMIT_REF"

# Check both BRANCH and HEAD — Netlify may use either for the PR branch name
for var in "$BRANCH" "$HEAD"; do
  case "$var" in
    chore/hive-snapshot*)
      echo "[netlify-ignore] Skipping build — hive snapshot branch: $var"
      exit 0
      ;;
  esac
done

echo "[netlify-ignore] Proceeding with build"
exit 1

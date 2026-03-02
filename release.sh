#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./release.sh <patch|minor|major|x.y.z> [--dry-run] [--publish] [--no-push]

Examples:
  ./release.sh patch
  ./release.sh patch --dry-run
  ./release.sh minor
  ./release.sh minor --publish
  ./release.sh 2.1.0 --no-push

This script will:
  1. verify the git worktree is clean
  2. bump the package version
  3. commit the release
  4. create a git tag
  5. optionally push the commit and tag
  6. optionally publish to npm
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

VERSION_ARG="$1"
shift

PUBLISH=false
PUSH=true
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    --publish)
      PUBLISH=true
      ;;
    --no-push)
      PUSH=false
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [[ "${DRY_RUN}" != "true" && -n "$(git status --porcelain)" ]]; then
  echo "Refusing to release with a dirty git worktree." >&2
  echo "Commit or stash your changes first." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to run releases." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to run releases." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Releasing from branch: ${CURRENT_BRANCH}"

CURRENT_VERSION="$(node -p "require('./package.json').version")"
NEW_VERSION="$(node -e "
  const semver = require('semver')
  const current = require('./package.json').version
  const arg = process.argv[1]
  const next = semver.valid(arg) || semver.inc(current, arg)
  if (!next) {
    process.exit(1)
  }
  process.stdout.write(next)
" "${VERSION_ARG}")"
TAG="v${NEW_VERSION}"

if [[ "${DRY_RUN}" == "true" ]]; then
  cat <<EOF
Dry run only. No files or tags will be changed.

Current version: ${CURRENT_VERSION}
Next version:    ${NEW_VERSION}
Branch:          ${CURRENT_BRANCH}
Tag:             ${TAG}
Will push:       ${PUSH}
Will publish:    ${PUBLISH}

Commands:
  npm version "${VERSION_ARG}" --no-git-tag-version
  git add package.json$( [[ -f yarn.lock ]] && printf ' yarn.lock' )$( [[ -f package-lock.json ]] && printf ' package-lock.json' )
  git commit -m "release: ${TAG}"
  git tag "${TAG}"
EOF

  if [[ "${PUSH}" == "true" ]]; then
    echo "  git push origin ${CURRENT_BRANCH}"
    echo "  git push origin ${TAG}"
  fi

  if [[ "${PUBLISH}" == "true" ]]; then
    echo "  npm publish"
  else
    echo "  # npm publish is handled by GitHub Actions trusted publishing"
  fi

  exit 0
fi

npm version "${VERSION_ARG}" --no-git-tag-version

git add package.json

if [[ -f yarn.lock ]]; then
  git add yarn.lock
fi

if [[ -f package-lock.json ]]; then
  git add package-lock.json
fi

git commit -m "release: ${TAG}"
git tag "${TAG}"

if [[ "${PUSH}" == "true" ]]; then
  git push origin "${CURRENT_BRANCH}"
  git push origin "${TAG}"
fi

if [[ "${PUBLISH}" == "true" ]]; then
  npm publish
fi

echo "Release complete: ${TAG}"

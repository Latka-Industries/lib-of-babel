#!/bin/sh
# Toolchain config size limits — supply-chain defense in depth.
# A toolchain config that suddenly balloons may have malware appended to it.
# POSIX sh so it runs in local dev, CI, and minimal Docker images (no bash).
#
# Ported from VerifyLocal.
#
# Usage:
#   sh scripts/check-config-sizes.sh           # scan the repo root
#   sh scripts/check-config-sizes.sh /path     # scan an explicit root
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ROOT=${1:-$REPO_ROOT}
cd "$ROOT"

DEFAULT_MAX_BYTES=4096

max_for() {
  case "$1" in
    vite.config.js|vite.config.ts|vite.config.mjs|vite.config.cjs) echo 2048 ;;
    postcss.config.js|postcss.config.mjs|postcss.config.cjs|postcss.config.ts) echo 2048 ;;
    svelte.config.js|svelte.config.ts) echo 2048 ;;
    prettier.config.js|prettier.config.mjs|prettier.config.cjs|prettier.config.ts) echo 2048 ;;
    next.config.js|next.config.ts|next.config.mjs|next.config.cjs) echo 16384 ;;
    tailwind.config.js|tailwind.config.ts|eslint.config.js|eslint.config.mjs|eslint.config.cjs|eslint.config.ts) echo 8192 ;;
    rollup.config.js|rollup.config.ts|playwright.config.js|playwright.config.ts|vitest.config.js|vitest.config.ts) echo 8192 ;;
    webpack.config.js|webpack.config.ts) echo 16384 ;;
    tsconfig.json|tsconfig.app.json|tsconfig.node.json|tsconfig.base.json) echo 8192 ;;
    *) echo "$DEFAULT_MAX_BYTES" ;;
  esac
}

file_list=$(mktemp)
trap 'rm -f "$file_list"' EXIT INT HUP
checked=0
failures=0

find . \
  \( -name node_modules -o -name .git -o -name .next -o -name dist -o -name build -o -name target -o -name pkg -o -name .svelte-kit \) -prune \
  -o -type f \
  \( \
    -name 'vite.config.*' -o -name 'postcss.config.*' -o -name 'svelte.config.*' -o -name 'tailwind.config.*' \
    -o -name 'eslint.config.*' -o -name 'prettier.config.*' -o -name 'webpack.config.*' -o -name 'rollup.config.*' \
    -o -name 'playwright.config.*' -o -name 'vitest.config.*' -o -name 'next.config.*' \
    -o -name 'tsconfig.json' -o -name 'tsconfig.*.json' \
  \) -print \
| sort >"$file_list"

while IFS= read -r file; do
  [ -n "$file" ] || continue
  rel=${file#./}
  base=$(basename "$rel")
  size=$(wc -c <"$file" | tr -d ' ')
  limit=$(max_for "$base")
  checked=$((checked + 1))

  if [ "$size" -gt "$limit" ]; then
    echo "FAIL  $rel  ${size} bytes  (limit ${limit})"
    failures=$((failures + 1))
  else
    echo "ok    $rel  ${size} bytes  (limit ${limit})"
  fi
done <"$file_list"

if [ "$checked" -eq 0 ]; then
  echo "No config files matched — nothing to check."
  exit 0
fi

if [ "$failures" -gt 0 ]; then
  echo "" >&2
  echo "${failures} config file(s) exceed size limits." >&2
  echo "Toolchain configs should be small; large files may indicate appended malware." >&2
  echo "Inspect the FAIL lines above." >&2
  exit 1
fi

echo ""
echo "All ${checked} config file(s) within size limits."

#!/bin/sh
# Fail when generated Rust alphabet packs drift from data/alphabets/*.txt.
# Snapshot current output → regenerate → require byte-identical results.
#
# Usage:
#   sh scripts/check-alphabet-packs.sh
#   mise run check-alphabets
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

RUST_PACK=src/config/generated/packs.rs

if [ ! -f "$RUST_PACK" ]; then
  echo "Missing generated alphabet packs ($RUST_PACK)." >&2
  echo "Run:  mise run gen-alphabets" >&2
  exit 1
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT HUP
cp "$RUST_PACK" "$tmpdir/"

PYTHON=${PYTHON:-python3}
"$PYTHON" scripts/gen-alphabet-packs.py

if ! cmp -s "$tmpdir/packs.rs" "$RUST_PACK"; then
  echo "Drift: $RUST_PACK does not match data/alphabets/*.txt" >&2
  echo "" >&2
  echo "Run:  mise run gen-alphabets" >&2
  echo "Then commit the updated generated file." >&2
  echo "" >&2
  diff -u "$tmpdir/packs.rs" "$RUST_PACK" >&2 || true
  exit 1
fi

echo "Alphabet packs match data/alphabets/*.txt"

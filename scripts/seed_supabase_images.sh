#!/usr/bin/env bash
set -euo pipefail

# Seed a few test images into the Supabase bucket and print their public URLs.
# Requirements: SUPABASE_URL, SUPABASE_ANON_KEY exported; supabase CLI installed.
# Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/seed_supabase_images.sh

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install from https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "SUPABASE_URL and SUPABASE_ANON_KEY must be set." >&2
  exit 1
fi

BUCKET="product-images"
TMPDIR="$(mktemp -d)"
echo "Using temp dir: $TMPDIR"

images=("https://placekitten.com/400/300" "https://placehold.co/400x300" "https://picsum.photos/400/300")

urls=()
for src in "${images[@]}"; do
  fname="$(basename "$src")"
  dest="${BUCKET}/seed-${fname}"
  curl -sL "$src" -o "$TMPDIR/$fname"
  supabase storage upload "$dest" "$TMPDIR/$fname" --bucket "$BUCKET" --no-verify-etag --public >/dev/null
  public_url="${SUPABASE_URL}/storage/v1/object/public/${dest}"
  urls+=("$public_url")
done

echo "Seeded image URLs:"
for u in "${urls[@]}"; do
  echo "  $u"
done

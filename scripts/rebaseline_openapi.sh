#!/usr/bin/env bash
set -euo pipefail

# Interactive helper to regenerate the OpenAPI schema and safely rebaseline committed files.
# Usage:
#   ./scripts/rebaseline_openapi.sh        # prompts before overwriting
#   ./scripts/rebaseline_openapi.sh --yes  # overwrite and commit without prompting

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
GEN_FILE="$REPO_ROOT/generated_schema.json"
BASE_FILES=("$REPO_ROOT/backend/api_schema.json" "$REPO_ROOT/api_schema.json")

AUTO=yes
if [ "${1:-}" = "--yes" ] || [ "${REBASE_AUTO:-}" = "1" ]; then
  AUTO=yes
else
  AUTO=no
fi

echo "Using DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-backend.omni_stock.schema_generate_settings}"
echo "Generating OpenAPI schema to: $GEN_FILE"

# Generate the schema using manage.py spectacular
DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-backend.omni_stock.schema_generate_settings} \
  python backend/manage.py spectacular --format openapi-json -o "$GEN_FILE"

if [ ! -f "$GEN_FILE" ]; then
  echo "Error: generated file not found at $GEN_FILE"
  exit 2
fi

echo
echo "Canonicalizing and showing diffs against baseline files..."

for B in "${BASE_FILES[@]}"; do
  if [ -f "$B" ]; then
    echo
    echo "--- Diff: $B -> generated ---"
    git --no-pager diff --no-index --color=always --word-diff=plain -- "$B" "$GEN_FILE" || true
  else
    echo "Note: baseline not found at $B"
  fi
done

if [ "$AUTO" = "no" ]; then
  read -r -p "Overwrite baseline files with generated schema and commit? [y/N]: " answer
  case "$answer" in
    [Yy]*) proceed=yes ;;
    *) echo "Aborting; no files changed."; exit 0 ;;
  esac
else
  proceed=yes
fi

if [ "$proceed" = "yes" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown-branch")
  echo "Overwriting baseline files and committing on branch: $BRANCH"
  for B in "${BASE_FILES[@]}"; do
    # create parent dir if missing
    mkdir -p "$(dirname "$B")"
    cp "$GEN_FILE" "$B"
    git add "$B"
  done

  set +e
  git commit -m "chore(openapi): rebaseline generated OpenAPI schema (branch: $BRANCH)" \
    || echo "No changes to commit (baselines already match generated schema)"
  set -e

  if git rev-parse --abbrev-ref @{u} >/dev/null 2>&1; then
    git push
  else
    echo "No upstream configured for $BRANCH; skipping push. You can push manually:"
    echo "  git push --set-upstream origin $BRANCH"
  fi

  echo "Rebaseline complete. Review the commit and open a PR if appropriate."
fi

exit 0

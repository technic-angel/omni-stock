#!/usr/bin/env bash
set -euo pipefail

# Simulate the CI OpenAPI check locally.
# Generates the schema, normalizes it, and if baselines changed,
# creates a local branch and commits the updated baseline files.

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

TMP_GEN=tmp/generated_openapi.json
mkdir -p tmp

echo "Generating OpenAPI schema to $TMP_GEN..."
python backend/manage.py spectacular --format openapi-json > "$TMP_GEN"

echo "Normalizing generated schema into baseline files..."
python scripts/normalize_openapi.py "$TMP_GEN" backend/api_schema.json api_schema.json

# Check for git changes
if git status --porcelain | grep -q "^"; then
  # Only commit if the baseline files changed
  if git diff --name-only | grep -E "^(backend/api_schema.json|api_schema.json)$" >/dev/null; then
    BRANCH="openapi-baseline-update-$(date +%s)"
    echo "Creating branch $BRANCH and committing updated baselines..."
    git checkout -b "$BRANCH"
    git add backend/api_schema.json api_schema.json
    git commit -m "openapi: normalize and update baseline schemas"
    echo "Committed updated baselines on branch: $BRANCH"
    echo "You can push with: git push -u origin $BRANCH"
  else
    echo "Changes present but not to baseline files. No commit created."
  fi
else
  echo "No changes detected after normalization."
fi

echo "Simulation complete."
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT=$(pwd)
TMP_DIR="$REPO_ROOT/tmp"
mkdir -p "$TMP_DIR"

echo "Installing drf-spectacular (if needed)..."
python -m pip install --upgrade pip >/dev/null
python -m pip install drf-spectacular >/dev/null || true

echo "Generating OpenAPI JSON..."
DJANGO_SETTINGS_MODULE=backend.omni_stock.schema_generate_settings DJANGO_SECRET_KEY=ci-secret DEBUG=False python backend/manage.py spectacular --format openapi-json > "$TMP_DIR/generated_schema.json"

echo "Normalizing generated schema..."
python3 scripts/normalize_openapi.py "$TMP_DIR/generated_schema.json" "$TMP_DIR/normalized_generated.json"

echo "Normalizing baseline..."
python3 scripts/normalize_openapi.py backend/api_schema.json "$TMP_DIR/normalized_baseline.json"

echo "Comparing normalized files..."
if ! git diff --no-index --quiet "$TMP_DIR/normalized_baseline.json" "$TMP_DIR/normalized_generated.json"; then
  echo "Normalized diff detected. Preparing local branch and commit..."
  cp "$TMP_DIR/normalized_generated.json" backend/api_schema.json
  cp "$TMP_DIR/normalized_generated.json" api_schema.json
  BRANCH_NAME="openapi/update-baseline-local-$(date +%s)"
  git checkout -b "$BRANCH_NAME"
  git add backend/api_schema.json api_schema.json
  if git commit -m 'chore(openapi): update normalized API schema baseline [skip ci]'; then
    echo "Created branch $BRANCH_NAME with committed baseline updates (local only)"
    git --no-pager show --name-only --oneline HEAD
  else
    echo "No baseline changes to commit"
  fi
else
  echo "No normalized differences found — nothing to do"
fi

echo "Simulation complete."

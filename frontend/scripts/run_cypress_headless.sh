#!/usr/bin/env bash
set -euo pipefail

# Helper to run the smoke spec locally in headless mode.
# Usage: BASE_URL=http://localhost:5173 ./frontend/scripts/run_cypress_headless.sh

BASE_URL=${BASE_URL:-http://localhost:5173}

echo "Running Cypress smoke spec against $BASE_URL"
cd "$(dirname "$0")/.."

# Install deps if needed (developer should run npm install once)
if [ ! -d node_modules ]; then
  echo "node_modules not present in frontend — run 'npm install' first"
  exit 1
fi

npx cypress run --headless --spec "cypress/integration/smoke.spec.ts" --config baseUrl=$BASE_URL

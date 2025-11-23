#!/usr/bin/env bash
set -euo pipefail

# Generate the OpenAPI schema into both baseline files.
# Run this from the repo root.

python backend/manage.py spectacular --format openapi-json > backend/api_schema.json
python backend/manage.py spectacular --format openapi-json > api_schema.json

echo "Updated backend/api_schema.json and api_schema.json"

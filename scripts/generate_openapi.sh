#!/usr/bin/env bash
set -euo pipefail

# Generate the OpenAPI schema into both baseline files.
# Run this from the repo root.

python core_api/manage.py spectacular --format openapi-json > core_api/api_schema.json
python core_api/manage.py spectacular --format openapi-json > api_schema.json

echo "Updated core_api/api_schema.json and api_schema.json"

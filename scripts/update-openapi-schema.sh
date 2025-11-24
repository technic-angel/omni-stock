#!/usr/bin/env bash
# Regenerate and normalize OpenAPI schema
# Usage: ./scripts/update-openapi-schema.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔄 Regenerating OpenAPI schema..."

# Check if docker-compose is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "⚠️  Backend container is not running. Starting docker-compose..."
    docker-compose up -d backend
    echo "⏳ Waiting for backend to be ready..."
    sleep 5
fi

# Generate schema in container using CI settings module
docker-compose exec -T backend bash -c \
    "DJANGO_SETTINGS_MODULE=backend.omni_stock.schema_generate_settings \
     DJANGO_SECRET_KEY=local-dev \
     DEBUG=False \
     python manage.py spectacular --format openapi-json" > "$REPO_ROOT/tmp/generated_schema.json"

# Normalize and update baseline files
python3 "$REPO_ROOT/scripts/normalize_openapi.py" \
    "$REPO_ROOT/tmp/generated_schema.json" \
    "$REPO_ROOT/backend/api_schema.json" \
    "$REPO_ROOT/api_schema.json"

echo "✅ OpenAPI schema updated successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review changes: git diff backend/api_schema.json"
echo "   2. Commit if changes look correct: git add backend/api_schema.json api_schema.json"
echo "   3. Push to remote"

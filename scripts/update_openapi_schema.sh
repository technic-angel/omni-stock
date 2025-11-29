#!/bin/bash
# Update OpenAPI schema baseline with normalization
# Run this before committing API changes to prevent CI drift errors

set -e

echo "Regenerating and normalizing OpenAPI schema baseline..."

TEMP_SCHEMA=$(mktemp)

# Generate schema
if docker-compose ps backend | grep -q "Up"; then
    docker-compose exec -T backend python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA"
    echo "✅ Schema generated using docker-compose"
else
    # Use CI settings for consistency
    cd backend
    DJANGO_SETTINGS_MODULE=backend.omni_stock.schema_generate_settings \
    DJANGO_SECRET_KEY=local-dev \
    DEBUG=False \
    python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA"
    cd ..
    echo "✅ Schema generated using local Python"
fi

# Normalize the schema to remove environment-dependent fields
echo "🔧 Normalizing schema..."
python3 scripts/normalize_openapi.py "$TEMP_SCHEMA" backend/api_schema.json api_schema.json

rm "$TEMP_SCHEMA"

echo ""
echo "✅ Schema updated and normalized:"
echo "   - backend/api_schema.json"
echo "   - api_schema.json"
echo ""
echo "📝 Changes normalized to be environment-independent:"
echo "   - Removed volatile fields (servers, version, description)"
echo "   - Removed environment-dependent integer bounds"
echo "   - Removed x- extension fields"
echo ""
echo "Don't forget to commit these files!"

#!/bin/bash
# Pre-commit hook to ensure OpenAPI schema is up to date and normalized
# Install: cp scripts/pre-commit-openapi.sh .git/hooks/pre-commit

# Check if any Python API files were modified
if git diff --cached --name-only | grep -qE "backend/.*(models|serializers|viewsets|urls)\.py$"; then
    echo "🔍 Detected API changes, checking OpenAPI schema..."
    
    # Generate current schema to temp file
    TEMP_SCHEMA=$(mktemp)
    NORMALIZED_SCHEMA=$(mktemp)
    
    if docker-compose ps backend | grep -q "Up"; then
        docker-compose exec -T backend python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA" 2>/dev/null
    else
        cd backend && \
        DJANGO_SETTINGS_MODULE=backend.omni_stock.schema_generate_settings \
        DJANGO_SECRET_KEY=local-dev \
        DEBUG=False \
        python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA" 2>/dev/null
        cd ..
    fi
    
    # Normalize the generated schema
    python3 scripts/normalize_openapi.py "$TEMP_SCHEMA" "$NORMALIZED_SCHEMA" 2>/dev/null
    
    # Compare normalized schema with committed baseline
    if ! diff -q backend/api_schema.json "$NORMALIZED_SCHEMA" > /dev/null 2>&1; then
        echo "⚠️  OpenAPI schema is out of date or not normalized!"
        echo "Run: ./scripts/update_openapi_schema.sh"
        echo "This will regenerate AND normalize the schema"
        rm "$TEMP_SCHEMA" "$NORMALIZED_SCHEMA"
        exit 1
    fi
    
    rm "$TEMP_SCHEMA" "$NORMALIZED_SCHEMA"
    echo "✅ OpenAPI schema is up to date and normalized"
fi

exit 0

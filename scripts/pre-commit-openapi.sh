#!/bin/bash
# Pre-commit hook to ensure OpenAPI schema is up to date
# Install: cp scripts/pre-commit-openapi.sh .git/hooks/pre-commit

# Check if any Python API files were modified
if git diff --cached --name-only | grep -qE "backend/.*(models|serializers|viewsets|urls)\.py$"; then
    echo "🔍 Detected API changes, checking OpenAPI schema..."
    
    # Generate current schema to temp file
    TEMP_SCHEMA=$(mktemp)
    
    if docker-compose ps backend | grep -q "Up"; then
        docker-compose exec -T backend python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA" 2>/dev/null
    else
        cd backend && python manage.py spectacular --format openapi-json > "$TEMP_SCHEMA" 2>/dev/null
        cd ..
    fi
    
    # Compare with committed schema
    if ! diff -q backend/api_schema.json "$TEMP_SCHEMA" > /dev/null 2>&1; then
        echo "⚠️  OpenAPI schema is out of date!"
        echo "Run: ./scripts/update_openapi_schema.sh"
        echo "Then stage the updated api_schema.json file"
        rm "$TEMP_SCHEMA"
        exit 1
    fi
    
    rm "$TEMP_SCHEMA"
    echo "✅ OpenAPI schema is up to date"
fi

exit 0

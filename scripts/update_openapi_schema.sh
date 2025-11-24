#!/bin/bash
# Update OpenAPI schema baseline
# Run this before committing API changes to prevent CI drift errors

set -e

echo "Regenerating OpenAPI schema baseline..."

# Check if docker-compose is running
if docker-compose ps backend | grep -q "Up"; then
    docker-compose exec -T backend python manage.py spectacular --format openapi-json --file api_schema.json
    echo "✅ Schema regenerated using docker-compose"
else
    # Try running without docker
    cd backend
    python manage.py spectacular --format openapi-json --file api_schema.json
    cd ..
    echo "✅ Schema regenerated using local Python"
fi

echo ""
echo "Schema updated at backend/api_schema.json"
echo "Don't forget to commit this file!"

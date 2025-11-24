#!/bin/bash
# Load demo data for backend testing (works with Docker)
# Usage: ./scripts/load_demo_data.sh [count] [--overwrite]

set -e

COUNT=${1:-20}
OVERWRITE_FLAG=""

if [[ "$2" == "--overwrite" ]] || [[ "$1" == "--overwrite" ]]; then
    OVERWRITE_FLAG="--overwrite"
fi

echo "🌱 Loading demo data..."
echo "Count: $COUNT items"

if docker-compose ps backend | grep -q "Up"; then
    echo "Using docker-compose backend..."
    docker-compose exec backend python manage.py load_demo_data --count "$COUNT" $OVERWRITE_FLAG
else
    echo "Docker not running, using local Python..."
    cd backend
    python manage.py load_demo_data --count "$COUNT" $OVERWRITE_FLAG
    cd ..
fi

echo ""
echo "✅ Demo data loaded! Use credentials:"
echo "   Username: demo_vendor"
echo "   Password: demo"

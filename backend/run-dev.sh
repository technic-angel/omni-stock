#!/bin/bash
# Run Django development server on port 4000 (frontend runs on 3000)
# Usage: ./run-dev.sh

cd "$(dirname "$0")"

echo "🚀 Starting Django development server on http://localhost:4000"
echo "📝 Frontend should connect via: http://localhost:3000"
echo ""

python manage.py runserver 4000

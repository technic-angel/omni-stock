#!/bin/sh

set -e

PORT=${PORT:-8000}
WEB_CONCURRENCY=${WEB_CONCURRENCY:-2}
MAX_MIGRATE_RETRIES=${MAX_MIGRATE_RETRIES:-12}
MIGRATE_DELAY=${MIGRATE_DELAY:-5}

echo "Running migrations (will retry up to ${MAX_MIGRATE_RETRIES} times)..."
attempt=0
until python manage.py migrate --noinput; do
	attempt=$((attempt + 1))
	if [ "$attempt" -ge "$MAX_MIGRATE_RETRIES" ]; then
		echo "Migrations failed after $attempt attempts. Exiting."
		exit 1
	fi
	echo "Migration attempt $attempt failed; retrying in ${MIGRATE_DELAY}s..."
	sleep $MIGRATE_DELAY
done

echo "Starting Gunicorn on port $PORT (workers=$WEB_CONCURRENCY)..."
exec gunicorn backend.omni_stock.wsgi:application --bind 0.0.0.0:$PORT --workers $WEB_CONCURRENCY --timeout 120

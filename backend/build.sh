#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build complete!"

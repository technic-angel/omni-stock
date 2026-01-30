#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

# Note: We do NOT run migrations here because the build environment 
# often lacks access to the production database on Render.
# Migrations should be run in the Release Command or start.sh.

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build complete!"

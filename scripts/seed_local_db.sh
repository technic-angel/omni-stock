#!/usr/bin/env bash
# Seed the local Docker database with predictable data for manual testing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

S_COMPOSE="-f docker-compose.yml -f docker-compose.override.yml"

COUNT="${COUNT:-20}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-1Tsn0tp@sssw0rd}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
OVERWRITE=1

usage() {
  cat <<'EOF'
Seed the local Docker DB with predictable data.

Usage:
  ./scripts/seed_local_db.sh [--count N] [--keep-existing]

Environment overrides:
  COUNT            Number of demo catalog items (default: 20)
  ADMIN_USERNAME   Admin login username (default: admin)
  ADMIN_PASSWORD   Admin login password (default: 1Tsn0tp@sssw0rd)
  ADMIN_EMAIL      Admin login email (default: admin@example.com)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --count)
      COUNT="$2"
      shift 2
      ;;
    --keep-existing)
      OVERWRITE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "$REPO_ROOT/.env" ]]; then
  echo "Missing .env file. Copy .env.example -> .env and configure local settings."
  exit 1
fi

echo "🚧 Seeding local database via docker compose (count=$COUNT)..."

OVERWRITE_FLAG=""
if [[ "$OVERWRITE" -eq 1 ]]; then
  OVERWRITE_FLAG="--overwrite"
fi

docker compose $S_COMPOSE run --rm backend bash -lc "
  cd /usr/src/app/backend && \
  python manage.py migrate
"

cat "$REPO_ROOT/scripts/seed_local_vendor_data.py" | \
  SEED_ADMIN_USERNAME="$ADMIN_USERNAME" \
  SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  SEED_ADMIN_EMAIL="$ADMIN_EMAIL" \
  docker compose $S_COMPOSE run --rm backend bash -lc "
    cd /usr/src/app/backend && \
    python manage.py shell
  "

docker compose $S_COMPOSE run --rm backend bash -lc "
  cd /usr/src/app/backend && \
  python manage.py load_demo_data --count ${COUNT} ${OVERWRITE_FLAG}
"

cat <<EOF
✅ Local seed complete.

Login credentials:
  Username: ${ADMIN_USERNAME}
  Password: ${ADMIN_PASSWORD}
EOF

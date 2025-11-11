Developer quickstart (local)
============================

This file contains the minimal commands to get the backend running in development.

Prerequisites
- Docker & docker-compose
- Python 3.11 (for local inspect/debug outside container)

Start backend

```bash
# from repo root
docker-compose build core_api
docker-compose up -d db
docker-compose up -d core_api

# view logs
docker-compose logs -f core_api
```

Run Django management commands inside the container

```bash
# create superuser (first run)
docker-compose exec core_api python manage.py createsuperuser

# run migrations
docker-compose exec core_api python manage.py migrate

# run checks
docker-compose exec core_api python manage.py check
```

Notes
- If you need to add a dependency, add it to `core_api/requirements.txt` and rebuild the image: `docker-compose build --no-cache core_api`.
- For quick local iteration you can run the Django dev server directly, but the dockerized path matches production more closely.

Generate OpenAPI schema (drf-spectacular)

```bash
# generate a local schema file (core_api container must have drf-spectacular installed)
docker-compose exec core_api python manage.py spectacular --file /tmp/schema.yml
```

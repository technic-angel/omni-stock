# Makefile - developer helpers for docker-based workflows

S_COMPOSE = -f docker-compose.yml -f docker-compose.override.yml

.PHONY: build-dev dev-up dev-shell test-docker stop

build-dev:
    # Build the dev image for the backend service (uses Dockerfile.dev)
	docker compose $(S_COMPOSE) build backend

dev-up:
    # Start db + backend service (runs in tail mode so you can exec into it)
	docker compose $(S_COMPOSE) up -d db backend

dev-shell:
    # Open an interactive shell in the backend dev container
	docker compose $(S_COMPOSE) run --rm backend bash

test-docker:
    # Run pytest inside the dev container. You can pass TEST=mytests to override the default path.
	TEST ?= backend/inventory/tests/api/test_card_details_api.py
	docker compose $(S_COMPOSE) run --rm backend bash -lc "cd /usr/src/app && pytest -q $(TEST)"

stop:
	docker compose $(S_COMPOSE) down -v


test-ci:
    # Run the full test suite inside the dev container and produce coverage.
    # Inside the container /usr/src/app/backend maps to ./backend on the host. Writing to backend/coverage.xml
    # therefore appears at ./backend/coverage.xml on the host. After the run we move it up to ./coverage.xml.
	docker compose $(S_COMPOSE) run --rm backend bash -lc "cd /usr/src/app && pytest --maxfail=1 --disable-warnings --cov=. --cov-report=xml:backend/coverage.xml" && \
	mv backend/coverage.xml coverage.xml || echo 'Coverage XML not found at backend/coverage.xml (tests may have failed)'

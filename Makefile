# Makefile - developer helpers for docker-based workflows

S_COMPOSE = -f docker-compose.yml -f docker-compose.override.yml

.PHONY: build-dev dev-up dev-shell test-docker stop

build-dev:
	# Build the dev image for the core_api service (uses Dockerfile.dev)
	docker compose $(S_COMPOSE) build core_api

dev-up:
	# Start db + core_api (core_api runs in tail mode so you can exec into it)
	docker compose $(S_COMPOSE) up -d db core_api

dev-shell:
	# Open an interactive shell in the core_api dev container
	docker compose $(S_COMPOSE) run --rm core_api bash

test-docker:
	# Run pytest inside the dev container. You can pass TEST=mytests to override the default path.
	TEST ?= collectibles/tests/test_card_details_api.py
	docker compose $(S_COMPOSE) run --rm core_api bash -lc "cd /usr/src/app && pytest -q $(TEST)"

stop:
	docker compose $(S_COMPOSE) down -v


test-ci:
	# Run the full test suite inside the dev container and write coverage to ./core_api/coverage.xml
	# Uses the dev image so tests run quickly without pip-install each run.
	docker compose $(S_COMPOSE) run --rm core_api bash -lc "cd /usr/src/app && pytest --maxfail=1 --disable-warnings --cov=. --cov-report=xml:core_api/coverage.xml"

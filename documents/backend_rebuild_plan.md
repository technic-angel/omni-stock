# Omni-Stock — Backend Project Rebuild Plan

## Goal
Restructure the Django project so all backend code (project scaffolding + domain logic) lives under a single `backend/` root, eliminating the legacy `core_api` folder while keeping tests, API endpoints, and deployment workflows working end-to-end.

---

## Phase 0 — Preconditions
- ✅ Stage 2 domain migrations complete: users, vendors, inventory, and core modules exist under `backend/`.
- ✅ Tests pass via dockerized `pytest` and frontend Vitest.
- ✅ Django project scaffold now lives entirely under `backend/` (legacy `core_api` folder removed after confirming the new structure works end-to-end).

---

## Phase 1 — Prepare New Django Project Structure
1. **Create new project root** inside `backend/`, e.g., `backend/omni_stock/`:
   - `manage.py` (relocated or re-created with identical settings).
   - `omni_stock/settings.py`, `urls.py`,
     `wsgi.py`, `asgi.py`.
   - Copy existing settings/URL configs but update `INSTALLED_APPS` to reference domain apps (`backend.users`, `backend.vendors`, `backend.inventory`, `backend.core`).
2. **Move Dockerfiles/scripts**:
   - Update backend Dockerfile(s) to point at the new project location.
   - Ensure docker-compose mounts `backend/` correctly.
3. **Update requirements and virtualenv references** to ensure Django and dependencies resolve from the new project root.

Deliverable: new Django project scaffold under `backend/` that mirrors the old `core_api` structure.

---

## Phase 2 — Wire Domain Modules to New Scaffold
1. Adjust Python import paths so `backend/users`, `backend/vendors`, `backend/inventory`, and `backend/core` register as Django apps in the new project.
2. Ensure management commands, admin registrations, and URL routers import directly from the domain modules.
3. Update tests (pytest/django config) to point at the new `backend.omni_stock` settings module.

Deliverable: Running the backend commands (`python manage.py`, `pytest`, `docker compose`) should work exclusively from the new `backend/` project.

---

## Phase 3 — Migration and Data Integrity
1. Confirm existing migrations apply under the new project path without data loss:
   - Re-run `python manage.py migrate` in Docker/CI.
   - Verify `collectibles` migration history is preserved (new app labels remain `collectibles` but code lives under backend).
2. Update `pytest.ini` and any CI scripts to use the new settings module.
3. Ensure OpenAPI generation (`manage.py spectacular`) still works and the baseline is updated.

Deliverable: database migrations + schema generation succeed from the backend project.

---

## Phase 4 — Remove Legacy `core_api` Folder
1. Once the new scaffold runs end-to-end, delete the legacy `core_api` directory (after one final test run to confirm no references remain).
2. Update documentation/readme to reflect new layout.
3. Run full test suites (dockerized pytest + frontend Vitest) and regenerate OpenAPI baseline one last time.

Deliverable: repository contains a single backend root (`backend/`) that houses both domain code and the Django project scaffolding.

---

## Risks & Mitigations
- **Risk:** Breaking manage.py paths during transition.
  - Mitigation: Work in a feature branch, copy existing scaffold before removal, run tests after each phase.
- **Risk:** Migration history/app labels change unexpectedly.
  - Mitigation: Keep `collectibles` app label in models’ Meta, avoid renaming DB tables.
- **Risk:** Docker/CI scripts referencing old paths.
  - Mitigation: Update docker-compose, scripts, and documentation as part of Phase 2.

---

## Next Steps
1. Green-light the plan (or adjust as needed).
2. Create a dedicated branch (e.g., `agent/backend-project-rebuild`).
3. Execute phases sequentially, with tests at each milestone.

### Progress Log
- 2024-XX-XX: Created new branch `agent/backend-project-rebuild`, copied Django settings/project scaffold into `backend/omni_stock/`, and added `backend/manage.py` pointing at `backend.omni_stock.settings`. Phase 1 scaffolding is now in place; upcoming work is wiring the new project into Docker/tests before removing `core_api`.
- 2025-11-21: Removed the legacy `core_api` folder entirely, moved the compatibility shim into the repo-root `collectibles/` package, updated Docker/Dockerfiles/CI to rely solely on `backend/`, and reran tests/OpenAPI generation.
- 2025-11-21: Updated docker-compose/Makefile/CI scripts, pytest config, and OpenAPI tooling to invoke `backend/manage.py`, set `PYTHONPATH` so legacy `collectibles` shims still load, moved `pytest.ini` to the repo root, and re-ran dockerized pytest, frontend Vitest, and `manage.py spectacular` to confirm the new scaffold works end-to-end.

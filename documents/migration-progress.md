# Omni-Stock Migration Progress (as of Stage 3 work)

## Backend (Stages 1–2)
- ✅ Domain skeleton created under `backend/users`, `backend/vendors`, `backend/inventory`, and `backend/core` with services, selectors, and tests.
- ✅ Existing Django models moved into their respective domains with compatibility shims now living under the top-level `collectibles/` package (legacy `core_api` folder removed).
- ✅ Inventory services/selectors implemented; DRF serializers/viewsets delegate to them.
- ✅ Tests relocated to `backend/<domain>/tests/` and run via dockerized pytest.
- ✅ Django project scaffold now runs entirely from `backend/manage.py`; docker-compose, `Makefile`, OpenAPI scripts, pytest configs, and CI workflows invoke the backend project (with `PYTHONPATH` glue so the remaining legacy `collectibles` shims continue to load).
- 🔜 Next backend steps: finish extracting vendor/auth logic into domain modules, enforce shared permissions via `backend/core`, and retire remaining legacy code.

## Frontend (Stage 3 in progress)
- ✅ Feature-first layout in `frontend/src/features/{auth,inventory,vendors,dashboard}` with `shared/` modules for utilities, components, and types.
- ✅ Auth login/register forms now use React Hook Form + Zod, React Query hooks, and feature-local API clients; Redux slice moved under `features/auth/store/`.
- ✅ Inventory feature has shared layout, filter form with schema validation, and React Query-powered list page.
- ✅ Placeholder pages exist for dashboard and vendors; shared layout components (`Page`, `Card`) added for reuse.
- ✅ Frontend tests (`npm run test -- --run`) passing.
- 🔜 Next frontend steps: implement vendor/dashboard features, build inventory create/edit/delete flows, and extract reusable UI (tables/forms) into `shared/components/`.

## Overall Stage Status
- Stage 1 (Backend skeleton) — ✅ Complete.
- Stage 2 (Backend logic migration) — ✅ Core inventory work done; vendor/auth extraction still pending.
- Stage 3 (Frontend feature architecture) — 🚧 In progress; structure established, features being fleshed out.
- Upcoming: Stage 4 (Supabase Image Pipeline) once backend/frontend migrations are stable.

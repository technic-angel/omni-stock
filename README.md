# Omni Stock — MVP Status

This README summarizes the current MVP state, what's been completed, and what's next.

Quick context
- Core goal: vendor + store management and inventory tracking (no sales analytics yet).
- Deployments: frontend -> Vercel, backend -> Render, storage/DB -> Supabase. CI via GitHub Actions.

Current MVP status (high level)

- [x] Vendor model & membership design (documented)
- [x] API types and client stubs in frontend (`frontend/src/features/vendors/api/vendorsApi.ts`)
- [x] `StoreListCard` placeholder component exists (needs API wiring)
- [x] `StoreForm` component exists for creating stores
- [x] Design document: `documents/mvp plan final/MVP_Design_Document.md` (local, ignored)
- [x] `.gitignore` updated to ignore `documents/`

Checklist — what has been done

- [x] Draft full MVP plan and data model (vendor, vendor member, store, store access, inventory, sale)
- [x] Create design doc in `documents/mvp plan final/`
- [x] Add `.gitignore` entry for local documents
- [x] Replace root README with current MVP status and checklist

Checklist — next implementation items (priority order)

- [ ] Sprint 1 — Vendor & Member Management (2 weeks)
   - [ ] Backend models: `Vendor`, `VendorMember`
   - [ ] Endpoints: vendor CRUD, member invite/accept/update, transfer ownership
   - [ ] Frontend: `VendorOverviewPage`, `InviteMemberModal`, `TransferOwnershipModal`
   - [ ] Tests: permission and member flows

- [ ] Sprint 2 — Stores & Access Controls (2 weeks)
   - [ ] Backend models: `Store`, `StoreAccess`
   - [ ] Endpoints: store CRUD, assign/remove access
   - [ ] Frontend: `StoreListCard` (real data), `StoreDetailPage`, assign access UI

- [ ] Sprint 3 — Inventory Core (2–3 weeks)
   - [ ] Models: `InventoryItem` (commodity vs unique), `Sale`
   - [ ] Endpoints: inventory CRUD, bulk-remove (make sale)
   - [ ] Frontend: `InventoryTable`, `ItemFormModal`, `BasketBar`

- [ ] Sprint 4 — Basket flow, QA, polish (1 week)

Constraints & rules for MVP

- No soft-delete for items (deletions are permanent).
- Quantity tracked only for commodity items; unique collectibles are individual records with grade/condition.
- Permission checks must be enforced: vendor membership roles and store access determine allowed actions.

How to proceed

- If you approve the plan, next I can: generate DB migration models, scaffold backend endpoints for Sprint 1, and wire the `StoreListCard` to the API.
- I can also produce wireframes and component prop tables if you'd like UI-first work.

Local design doc

The full design document and additional planning material are in `documents/mvp plan final/MVP_Design_Document.md`. That folder is intentionally ignored by git (`.gitignore`) to keep local planning files private.

Contact

If anything here needs changing, reply with adjustments and I'll update the plan and start implementing.


[![codecov](https://codecov.io/gh/technic-angel/omni-stock/graph/badge.svg?token=M19L9AHOPN)](https://codecov.io/gh/technic-angel/omni-stock)

A modern, full-stack inventory management system for collectibles. Built with Django REST Framework, React, and TypeScript, featuring real-time search, image management via Supabase, and automated CI/CD pipelines.

## Features

- **Multi-Vendor Inventory**: Track collectibles across multiple vendors and product types
- **Image Management**: Integrated Supabase storage for product images
- **REST API**: Comprehensive API with OpenAPI/Swagger documentation
- **Modern Frontend**: React + TypeScript + Vite with TailwindCSS
- **Test Coverage**: Full test suite with Codecov integration
- **CI/CD**: Automated testing, preview deploys on Render and Vercel
- **Docker Support**: Containerized development and production environments

## Tech Stack

**Backend**
- Django 5.0.6 + Django REST Framework 3.15.2
- PostgreSQL with psycopg 3.1.18
- Gunicorn WSGI server
- Docker + Docker Compose

**Frontend**
- React 18 + TypeScript
- Vite 7.x build tool
- TailwindCSS + shadcn/ui components
- React Query for server state
- React Hook Form + Zod validation
- Cypress for E2E testing

**Infrastructure**
- Render (backend hosting)
- Vercel (frontend hosting)
- Supabase (image storage)
- GitHub Actions (CI/CD)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/technic-angel/omni-stock.git
cd omni-stock
```

### 2. Configure Environment

```bash
cp dev.env .env
# Edit .env to set:
# - DJANGO_SECRET_KEY (generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
# - POSTGRES_PASSWORD (set a secure password)
```

### 3. Build and Start

```bash
# Build the development image
make build-dev

# Start the database and API server
make dev-up
```

The API will be available at `http://localhost:8000`

### 4. Run Tests

```bash
# Run full test suite with coverage
make test-ci

# Run specific test file
TEST=backend/inventory/tests/api/test_card_details_api.py make test-docker
```

### 5. Frontend Development (Optional)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development Workflow

### Access the API

- **API Root**: `http://localhost:8000/`
- **Admin Panel**: `http://localhost:8000/admin/`
- **API Documentation**: `http://localhost:8000/api/docs/`
- **Health Check**: `http://localhost:8000/health/`

### Open a Shell in the Container

```bash
make dev-shell
```

### Run Database Migrations

```bash
docker-compose exec backend python manage.py migrate
```

### Create a Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

## API Endpoints

The API provides the following main endpoints:

- `/api/inventory/` - Inventory management
- `/api/users/` - User authentication and management
- `/api/vendors/` - Vendor management
- `/api/docs/` - Interactive API documentation (Swagger UI)
- `/api/schema/` - OpenAPI schema
- `/health/` - Health check endpoint

## Image Storage (Supabase)

This project uses Supabase for image storage. To set up:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a `product-images` bucket (public)
3. Set up policies on `storage.objects`:
   - Allow SELECT + INSERT for `anon` and `authenticated` roles
   - Filter: `bucket_id = 'product-images'`
   - Optional: Add DELETE policy for `authenticated` role

### Seed Test Images

Install the root tooling dependencies once:

```bash
npm install
```

Then run the seed script with your Supabase credentials:

```bash
SUPABASE_URL=https://<your-project>.supabase.co \
SUPABASE_ANON_KEY=<your-anon-key> \
node scripts/seed_supabase_images.mjs
```

## Environment Variables

### Backend (.env)
```bash
# Django
DJANGO_SECRET_KEY=<generate-secure-key>
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
POSTGRES_DB=omnistock_dev
POSTGRES_USER=omnistock
POSTGRES_PASSWORD=<secure-password>
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_SSL_MODE=prefer

# CORS/CSRF
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
# Frontend redirect target (defaults to http://localhost:5173 if unset)
FRONTEND_URL=https://omni-stock-three.vercel.app
```

### Frontend (.env.local)
```bash
VITE_API_BASE=http://localhost:8000
VITE_API_BASE_PROD=https://omni-stock.onrender.com
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
Set `VITE_API_BASE` (or `VITE_API_BASE_PROD`) to `https://omni-stock.onrender.com` in production so the deployed frontend calls the Render backend.

## Render Deployment (Backend)

The backend `Dockerfile` at `backend/Dockerfile` is Render-ready:

1. In Render, create a new **Web Service**. If you leave the root directory blank, Render will use the repo-level `Dockerfile` (which already proxies into `backend/`). Alternatively, set the root to `backend/` explicitly.
2. Set build command to `docker build -t omni-stock-backend .` (Render will infer from Dockerfile).
3. Expose port `8000`.
4. Add environment variables:
   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
   - `DJANGO_SECRET_KEY` (strong random value)
   - `ALLOWED_HOSTS` (comma-separated domains, e.g., `your-service.onrender.com`)
   - `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` (comma-separated HTTPS origins)
   - `FRONTEND_URL=https://omni-stock-three.vercel.app` (public URL used for redirects/CORS)
   - `POSTGRES_SSL_MODE=require` (Supabase/Postgres typically needs SSL)
   - Any Supabase envs needed by future tasks
5. Render will call `/health/` to verify the service; the endpoint returns `{"status":"ok"}`.

Static files are collected into `backend/staticfiles` (via `STATIC_ROOT`), and Gunicorn serves the WSGI app per Render’s requirements.

## Environment & Secrets

Local development uses a `.env` file (gitignored). Copy `dev.env` to `.env` and adjust values. Never commit real secrets. In CI, secrets are provided via GitHub Actions (e.g. `CODECOV_TOKEN`).

`DJANGO_SECRET_KEY` must be set when `DEBUG=False` (the app will raise on start if missing in non-debug mode). For local dev you may use the placeholder.

## Coverage & Code Quality

Coverage is uploaded to Codecov when `CODECOV_TOKEN` is present. The CI workflow enforces a minimum threshold and comments on pull requests with the current percentage.

## Next Steps

See `docs/project-roadmap.md` and runbooks under `docs/runbooks/` for operational guidance (e.g. index creation with `CONCURRENTLY`).

## Repository Rules

- **Agent/Automation rules**: Automation and contributors must follow the repository agent rules in `docs/project-roadmap.md` "Agent Execution Rules": explain before edits, create a branch per feature, update the todo list, avoid committing secrets, run tests before committing, and include an identifying line in automated commits.
- **Merge protection rule**: Do not merge pull requests into `main` until all CI checks pass. Every PR must show green check runs in GitHub Actions before merging to `main`.

## Try the demo (5 minutes)

If you want to quickly run the app and exercise the core demo flow (register → login → create → delete), follow these steps. This is intentionally minimal — if you prefer a hosted demo link, add it here.

1. Start the development stack (backend + db + frontend dev server):

```bash
# from repo root
make dev-up
cd frontend
npm install
npm run dev
```

2. Open the frontend dev URL (printed by Vite, usually http://localhost:5173) and register a new user.

3. From the app: log in, create a collectible, confirm it appears in the list, then delete it to complete the smoke flow.

4. Optional: run the Cypress smoke test skeleton (if you have Cypress installed):

```bash
cd frontend
# install dev deps if not present
npm install
# run the (placeholder) smoke spec in headless mode
npx cypress run --spec "cypress/integration/smoke.spec.ts"
```

Demo checklist (for README / recruiter copy)
- [ ] Live demo link (add URL here if hosted)
- [ ] 2–3 minute screencast link (optional)
- [ ] CI badge(s) and passing E2E smoke test on PR previews

If you want, I can add a recorded screencast file under `docs/` and wire the Cypress test to run against PR previews.

## Vercel Deployment (Frontend)

1. In Vercel, create a new project and point it at the `frontend/` directory.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Configure environment variables (in Vercel project settings):
   - `VITE_API_BASE` (Render backend URL)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. The app will call the backend using `VITE_API_BASE`.

The GitHub preview workflow already runs `npm run build` and `vercel deploy --prebuilt` when secrets are provided.

## Project Status

**MVP Features:**
- ✅ User authentication & authorization
- ✅ Inventory CRUD operations
- ✅ Image upload via Supabase
- ✅ Vendor management
- ✅ CI/CD pipeline with automated testing
- 🚧 Advanced search (in progress)
- 🚧 Bulk import/export (planned)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is private and proprietary.

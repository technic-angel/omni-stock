# omni-stock

![Omni-Stock Logo](documents/omni-stock-logo/omni-stock-logo-horizontal-gem.svg)

[![codecov](https://codecov.io/gh/technic-angel/omni-stock/graph/badge.svg?token=M19L9AHOPN)](https://codecov.io/gh/technic-angel/omni-stock)

## Developer Quickstart

Clone the repo and build the dev image:

```bash
git clone https://github.com/technic-angel/omni-stock.git
cd omni-stock
make build-dev
```

Create your environment file:

```bash
cp dev.env .env
# edit .env to set a real DJANGO_SECRET_KEY and POSTGRES_PASSWORD if desired
```

Start the database and API container:

```bash
make dev-up
```

Open a shell in the dev container (optional):

```bash
make dev-shell
```

Run a single test file (default target runs one API test):

```bash
make test-docker           # runs backend/inventory/tests/api/test_card_details_api.py by default
TEST=backend/inventory/tests/models/test_models.py make test-docker   # specify an alternate file
```

Run the full test suite with coverage written to `coverage.xml`:

```bash
make test-ci
```

## Supabase Image Seeding (Dev/Staging)

If you want quick test images in the `product-images` bucket for frontend debugging:

```bash
# Requires supabase CLI plus env vars
cd scripts
SUPABASE_URL=... SUPABASE_ANON_KEY=... ./seed_supabase_images.sh
```

The script uploads a few sample images and prints their public URLs you can drop into forms or fixtures.

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

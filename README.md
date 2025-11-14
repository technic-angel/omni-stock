# omni-stock

[![Coverage](https://codecov.io/gh/technic-angel/omni-stock/branch/main/graph/badge.svg)](https://codecov.io/gh/technic-angel/omni-stock)

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
make test-docker           # runs collectibles/tests/test_card_details_api.py by default
TEST=collectibles/tests/test_models.py make test-docker   # specify an alternate file
```

Run the full test suite with coverage written to `coverage.xml`:

```bash
make test-ci
```

## Environment & Secrets

Local development uses a `.env` file (gitignored). Copy `dev.env` to `.env` and adjust values. Never commit real secrets. In CI, secrets are provided via GitHub Actions (e.g. `CODECOV_TOKEN`).

`DJANGO_SECRET_KEY` must be set when `DEBUG=False` (the app will raise on start if missing in non-debug mode). For local dev you may use the placeholder.

## Coverage & Code Quality

Coverage is uploaded to Codecov when `CODECOV_TOKEN` is present. The CI workflow enforces a minimum threshold and comments on pull requests with the current percentage.

## Next Steps

See `docs/project-roadmap.md` and runbooks under `docs/runbooks/` for operational guidance (e.g. index creation with `CONCURRENTLY`).

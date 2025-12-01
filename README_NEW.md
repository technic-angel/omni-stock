# Omni-Stock

![Omni-Stock Logo](frontend/public/branding/omni-stock-logo-horizontal-gem.svg)

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
- TailwindCSS for styling
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
# Optional single connection string (e.g., Supabase)
DATABASE_URL=postgresql://user:password@host:5432/dbname

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

## Deployment

### Backend (Render)

1. **Create a Web Service** in Render
2. **Configure Build Settings**:
   - Root Directory: `backend`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn omni_stock.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
3. **Set Environment Variables**:
   ```bash
   DJANGO_SECRET_KEY=<generate-secure-key>
   DEBUG=False
   POSTGRES_DB=<your-db-name>
   POSTGRES_USER=<your-db-user>
   POSTGRES_PASSWORD=<your-db-password>
   POSTGRES_HOST=<your-db-host>
   POSTGRES_PORT=5432
   POSTGRES_SSL_MODE=require
   # or DATABASE_URL=postgresql://user:password@host:5432/dbname
   FRONTEND_URL=https://omni-stock-three.vercel.app
   ```
4. **Auto-Configuration**: The app automatically detects Render deployment and configures:
   - `ALLOWED_HOSTS` with `.onrender.com` wildcard
   - CORS settings for `*.onrender.com` and `*.vercel.app` domains
   - CSRF trusted origins

The `/health/` endpoint is used for health checks and returns `{"status":"ok"}`.

### Frontend (Vercel)

1. **Create a New Project** in Vercel
2. **Configure Build Settings**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Set Environment Variables**:
   ```bash
   VITE_API_BASE=https://your-backend.onrender.com
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

### Preview Deployments

Pull requests automatically trigger preview deployments:
- **Frontend**: Deploys to Vercel (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)
- **Backend**: Deploys to Render for non-draft PRs

## Testing

### Local Testing

```bash
# Run all tests with coverage
make test-ci

# Run specific test file
TEST=backend/inventory/tests/api/test_card_details_api.py make test-docker

# Run tests in dev container
make dev-shell
pytest backend/inventory/tests/
```

### E2E Testing

```bash
cd frontend
npm install
npx cypress run --spec "cypress/integration/smoke.spec.ts"
```

## Code Quality

- **Test Coverage**: Automated coverage reports via Codecov
- **CI/CD**: GitHub Actions runs tests on all PRs
- **Code Standards**: Pre-commit hooks and linting configured

## Project Structure

```
omni-stock/
├── backend/              # Django REST API
│   ├── core/            # Core utilities and base classes
│   ├── inventory/       # Inventory management app
│   ├── users/           # User authentication
│   ├── vendors/         # Vendor management
│   └── omni_stock/      # Project settings
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   └── cypress/        # E2E tests
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Ensure all tests pass (`make test-ci`)
4. Open a pull request
5. Wait for CI checks to pass before merging

## License

This project is private and proprietary.

## Contact

For questions or support, please open an issue on GitHub.

# Omni-Stock Copilot Instructions

## Project Overview
Multi-tenant inventory management system for collectibles. Django REST backend with React/TypeScript frontend. Vendor-scoped data isolation is enforced at every layer.

## Architecture

### Backend (Django + DRF)
- **Domain apps**: `catalog` (inventory), `org` (vendors/stores), `users`, `vendors`
- **Service/Selector pattern**: Business logic lives in `services/` (writes) and `selectors/` (reads), NOT in viewsets
  - Example: `backend/catalog/services/create_item.py` for item creation
  - Example: `backend/catalog/selectors/list_items.py` for querying items
- **Vendor scoping**: All queries filtered by `resolve_user_vendor(user)` from `backend/core/permissions.py`
- **Multi-tenancy hierarchy**: `Vendor` → `Store` → `CatalogItem` (users belong to vendors via `VendorMember`)

### Frontend (React + TypeScript + Vite)
- **Feature-based structure**: `frontend/src/features/{auth,inventory,vendors,dashboard}/`
- **API layer**: Feature-specific API files (e.g., `features/inventory/api/collectiblesApi.ts`) use shared `http` client
- **State**: Redux Toolkit for auth state, React Query for server data
- **Routing**: Protected routes require auth + vendor membership; see `app/routes/AppRoutes.tsx`

### Key Data Flow
```
Frontend → http.ts (JWT injection) → /api/v1/catalog/items/ → ViewSet → Service/Selector → Model
                                                              ↓
                                              VendorScopedPermission enforces tenant isolation
```

## Development Commands

```bash
# Start local environment (Docker)
make dev-up              # Starts db + backend at localhost:8000

# Backend shell access
make dev-shell           # Opens bash in backend container

# Run tests
make test-ci             # Full test suite with coverage
TEST=backend/catalog/tests/api/test_card_details_api.py make test-docker  # Single test

# Linting & formatting
make lint-backend        # Ruff linter
make format-backend      # isort + black

# Frontend (from frontend/)
npm run dev              # Vite dev server at localhost:5173
npm run lint             # ESLint
npm run test             # Vitest
```

## Code Conventions

### Backend
- **Imports**: Use absolute imports `from backend.catalog.models import CatalogItem`
- **Services**: Functions take `*` keyword-only args: `def create_item(*, data, card_details_data=None)`
- **Transactions**: Wrap multi-model writes in `with transaction.atomic()`
- **Serializers**: Nested writes use `source=` mapping (e.g., `card_details` → `card_metadata`)
- **Testing**: Use factories from `backend/catalog/tests/factories.py`; test files in `tests/api/`, `tests/services/`

### Frontend
- **API calls**: Return raw data, let React Query handle caching; functions in `features/*/api/`
- **Components**: Use shadcn/ui components from `components/ui/`; Tailwind for styling
- **Forms**: React Hook Form + Zod for validation
- **Path aliases**: `@/` maps to `src/` (e.g., `import { Button } from '@/components/ui/button'`)

## API Endpoints
- `/api/v1/catalog/items/` – CatalogItem CRUD (vendor-scoped)
- `/api/v1/org/vendors/` – Vendor and store management
- `/api/v1/auth/*` – JWT auth (obtain, refresh, register)
- `/api/v1/schema/` – OpenAPI docs (drf-spectacular)

## Testing Patterns

### Backend
```python
# Always scope test data to a vendor
vendor = VendorFactory()
store = StoreFactory(vendor=vendor)
item = CatalogItemFactory(vendor=vendor, store=store)

# Test vendor isolation explicitly
other_vendor = VendorFactory()
# Assert user from other_vendor cannot access item
```

### Frontend
- Vitest for unit tests; Cypress for E2E (`npm run cypress:open`)
- API tests mock `http` client, not axios directly

## Environment Variables
Copy `dev.env.example` to `.env`. Key vars:
- `DJANGO_SECRET_KEY`, `POSTGRES_*` – Required for backend
- `SUPABASE_*` – Image storage (optional for local dev)
- `VITE_API_BASE` – Frontend API URL override

## CI/CD
- GitHub Actions runs on PRs: backend tests, frontend lint/tests, OpenAPI schema check
- Preview deploys: Render (backend), Vercel (frontend)
- OpenAPI schema must stay in sync—run `scripts/update_openapi_schema.sh` after API changes

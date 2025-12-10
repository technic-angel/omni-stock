# Local Development Setup

## Quick Start (Port Configuration)

- **Frontend (Vite)**: http://localhost:3000
- **Backend (Django)**: http://localhost:4000
- **API Endpoint**: http://localhost:4000/api

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or use Docker)

## Environment Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment file:
```bash
cp dev.env.example .env
# Edit .env with your database credentials
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser (optional):
```bash
python manage.py createsuperuser
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. The `.env` file should already have:
```env
VITE_API_BASE=http://localhost:4000/api
```

## Running the Application

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
./run-dev.sh
# Or manually: python manage.py runserver 4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then visit: http://localhost:3000

### Option 2: Docker (Not configured for new ports yet)

```bash
docker-compose up
```

## Testing Backend Connection

1. Start backend: `cd backend && ./run-dev.sh`
2. Test health endpoint:
```bash
curl http://localhost:4000/api/health/
# Should return: {"status":"ok"}
```

3. Start frontend: `cd frontend && npm run dev`
4. Go to http://localhost:3000/dashboard
5. Click "Test API" button
6. Should see green success message with backend response

## API Endpoints

### Health Check
```bash
GET http://localhost:4000/api/health/
```

### Authentication
```bash
POST http://localhost:4000/api/v1/auth/register/
POST http://localhost:4000/api/v1/auth/token/
POST http://localhost:4000/api/v1/auth/token/refresh/
```

### Dashboard
```bash
GET http://localhost:4000/api/v1/dashboard/summary/
```

### Inventory
```bash
GET    http://localhost:4000/api/v1/collectibles/
POST   http://localhost:4000/api/v1/collectibles/
GET    http://localhost:4000/api/v1/collectibles/{id}/
PUT    http://localhost:4000/api/v1/collectibles/{id}/
PATCH  http://localhost:4000/api/v1/collectibles/{id}/
DELETE http://localhost:4000/api/v1/collectibles/{id}/
```

### Vendors
```bash
GET    http://localhost:4000/api/v1/vendors/
POST   http://localhost:4000/api/v1/vendors/
GET    http://localhost:4000/api/v1/vendors/{id}/
PUT    http://localhost:4000/api/v1/vendors/{id}/
DELETE http://localhost:4000/api/v1/vendors/{id}/
```

## Verifying React Query

The dashboard page demonstrates React Query in action:

1. **Automatic Data Fetching**: Dashboard loads summary data from backend
2. **Error Handling**: Shows error alert if backend is down
3. **Loading States**: Displays skeleton loaders while fetching
4. **Caching**: Data cached for 2 minutes (no redundant requests)
5. **Retry Logic**: Automatically retries failed requests

**Query Key Structure:**
```typescript
['dashboard', 'summary']           // Dashboard summary
['collectibles']                   // All collectibles
['collectibles', category]         // Filtered collectibles
['collectible', id]                // Single collectible
['vendors']                        // All vendors
['vendor', id]                     // Single vendor
```

## Frontend Architecture

### File Structure
```
frontend/src/
├── app/
│   ├── layout/
│   │   ├── AppLayout.tsx      ← Main layout with sidebar
│   │   ├── Sidebar.tsx        ← Collapsible sidebar (64px → 240px)
│   │   └── TopNavbar.tsx      ← Top actions bar
│   ├── providers/
│   │   └── AppProviders.tsx   ← React Query, Auth, Toaster
│   └── routes/
│       ├── AppRoutes.tsx      ← Route definitions
│       └── ProtectedRoute.tsx ← Auth guard
│
├── features/
│   ├── auth/                  ← Login, register
│   ├── dashboard/             ← Dashboard with stats
│   ├── inventory/             ← Collectibles CRUD
│   └── vendors/               ← Vendor management
│
├── shared/
│   ├── components/            ← Reusable components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingState.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/                 ← Custom hooks
│   └── lib/                   ← Utilities
│       ├── http.ts            ← Axios instance
│       ├── utils.ts           ← cn() helper
│       └── tokenStore.ts      ← JWT storage
│
└── components/ui/             ← ShadCN UI components (27 total)
```

### Design System

**Colors (Tiffany Blue Brand):**
- Primary: `#37C5B8` (Tiffany blue)
- Surface: `#F9FBFB` (Card backgrounds)
- Border: `#E5EBEE` (Dividers)

**Usage:**
```tsx
className="bg-brand-primary text-white"
className="border-brand-border bg-brand-surface"
```

## Common Development Tasks

### Create a New Feature

1. Create feature directory:
```bash
mkdir -p frontend/src/features/my-feature/{api,components,hooks,pages,schema}
```

2. Create API file (`api/myFeatureApi.ts`):
```typescript
import { http } from '@/shared/lib/http'
import { useQuery } from '@tanstack/react-query'

export async function fetchMyData() {
  const { data } = await http.get('/v1/my-endpoint/')
  return data
}

export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: fetchMyData
  })
}
```

3. Create page component (`pages/MyPage.tsx`):
```typescript
import { useMyData } from '../api/myFeatureApi'

export default function MyPage() {
  const { data, isLoading } = useMyData()
  
  if (isLoading) return <LoadingState />
  
  return <div>{/* Your UI */}</div>
}
```

4. Add route (`app/routes/AppRoutes.tsx`):
```tsx
<Route path="/my-feature" element={<MyPage />} />
```

### Add a New ShadCN Component

```bash
cd frontend
npx shadcn@latest add [component-name]
# Example: npx shadcn@latest add calendar
```

### Run Tests

```bash
# Frontend unit tests
cd frontend
npm run test

# Backend tests
cd backend
pytest
```

## Troubleshooting

### Port Already in Use

**Frontend (port 3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

**Backend (port 4000):**
```bash
lsof -ti:4000 | xargs kill -9
```

### CORS Errors

Ensure backend `.env` has:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### React Query Not Working

1. Check API base URL in `frontend/.env`:
```env
VITE_API_BASE=http://localhost:4000/api
```

2. Verify backend is running: `curl http://localhost:4000/api/health/`

3. Check browser DevTools Network tab for failed requests

### Sidebar Not Showing

1. Check that `AppLayout` is rendered in routes
2. Verify ShadCN components installed: `npm list lucide-react`
3. Check browser console for import errors

## Next Steps

- [ ] Complete authentication flow (login/register pages)
- [ ] Build inventory list with filters
- [ ] Implement CRUD operations for collectibles
- [ ] Add image upload with Supabase
- [ ] Create vendor management pages
- [ ] Add charts to dashboard (Recharts)
- [ ] Implement advanced filtering
- [ ] Add pagination and sorting
- [ ] Mobile optimization

---

**Questions?** See `documents/REACT_ROUTER_GUIDE.md` for routing details.

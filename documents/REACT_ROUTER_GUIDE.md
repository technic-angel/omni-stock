# React Router Configuration

## Overview

Omni-Stock uses **React Router v6** for client-side routing. The app uses:
- Nested routes with shared layouts
- URL parameters (slugs) for dynamic pages
- Protected routes for authenticated content
- Query parameters for filters/search

## Port Configuration

- **Frontend (Vite)**: `http://localhost:3000`
- **Backend (Django)**: `http://localhost:4000`
- **API Base URL**: `http://localhost:4000/api`

## Route Structure

```tsx
<Routes>
  <Route element={<AppLayout />}>          // Shared layout (sidebar + navbar)
    <Route path="/" element={<CollectiblesListPage />} />
    <Route path="/inventory" element={<CollectiblesListPage />} />
    <Route path="/inventory/:collectibleId/edit" element={<ProtectedRoute><CollectibleEditPage /></ProtectedRoute>} />
    <Route path="/inventory/new" element={<ProtectedRoute><CollectibleNewPage /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/vendors" element={<ProtectedRoute><VendorOverviewPage /></ProtectedRoute>} />
    <Route path="/vendors/:vendorId" element={<ProtectedRoute><VendorDetailPage /></ProtectedRoute>} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
</Routes>
```

## URL Patterns & Slugs

### 1. **Path Parameters (Slugs)**

Used for identifying specific resources in the URL.

**Example: Edit a collectible**
```
URL: /inventory/123/edit
Pattern: /inventory/:collectibleId/edit
```

**In Component:**
```tsx
import { useParams } from 'react-router-dom'

function CollectibleEditPage() {
  const { collectibleId } = useParams()  // "123"
  
  const { data } = useQuery({
    queryKey: ['collectible', collectibleId],
    queryFn: () => fetchCollectible(collectibleId)
  })
}
```

**Example: Vendor detail page**
```
URL: /vendors/acme-corp
Pattern: /vendors/:vendorId
```

```tsx
function VendorDetailPage() {
  const { vendorId } = useParams()  // "acme-corp"
}
```

### 2. **Query Parameters**

Used for filters, search, pagination.

**Example: Filtered inventory**
```
URL: /inventory?category=cards&search=pikachu&page=2
```

**In Component:**
```tsx
import { useSearchParams } from 'react-router-dom'

function CollectiblesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const category = searchParams.get('category')     // "cards"
  const search = searchParams.get('search')         // "pikachu"
  const page = searchParams.get('page')             // "2"
  
  // Update query params
  const handleFilterChange = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' })
  }
  
  // React Query with query params
  const { data } = useQuery({
    queryKey: ['collectibles', category, search, page],
    queryFn: () => fetchCollectibles({ category, search, page })
  })
}
```

### 3. **Nested Routes with Params**

**Example: Category-specific views**
```
URL: /inventory/category/pokemon-cards
Pattern: /inventory/category/:categorySlug
```

```tsx
<Route path="/inventory">
  <Route index element={<CollectiblesListPage />} />
  <Route path="category/:categorySlug" element={<CategoryViewPage />} />
  <Route path=":collectibleId/edit" element={<CollectibleEditPage />} />
</Route>
```

## Navigation Methods

### 1. **Link Component**

```tsx
import { Link } from 'react-router-dom'

<Link to="/inventory/123/edit">Edit Item</Link>
<Link to="/vendors/acme-corp">View Vendor</Link>
<Link to="/inventory?category=cards">Filter Cards</Link>
```

### 2. **Programmatic Navigation**

```tsx
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  const handleSave = async () => {
    await saveItem()
    navigate('/inventory')  // Redirect after save
    // or
    navigate(-1)  // Go back
    // or
    navigate('/inventory/123/edit', { replace: true })  // Replace history
  }
}
```

### 3. **Navigation with State**

```tsx
navigate('/inventory/new', { 
  state: { 
    defaultCategory: 'pokemon-cards',
    fromDashboard: true 
  } 
})

// In destination component
import { useLocation } from 'react-router-dom'

function CollectibleNewPage() {
  const location = useLocation()
  const { defaultCategory, fromDashboard } = location.state || {}
}
```

## Protected Routes

Routes requiring authentication use the `ProtectedRoute` wrapper:

```tsx
// src/app/routes/ProtectedRoute.tsx
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  if (!isAuthenticated) {
    // Redirect to login, save intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}
```

**Usage:**
```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

## React Query Integration

### Query Keys with URL Params

```tsx
// Good: Include all params in query key
const { collectibleId } = useParams()
const [searchParams] = useSearchParams()
const category = searchParams.get('category')

const { data } = useQuery({
  queryKey: ['collectible', collectibleId, category],
  queryFn: () => fetchCollectible(collectibleId, { category })
})
```

### Prefetching on Link Hover

```tsx
import { useQueryClient } from '@tanstack/react-query'

function CollectibleCard({ collectible }) {
  const queryClient = useQueryClient()
  
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['collectible', collectible.id],
      queryFn: () => fetchCollectible(collectible.id)
    })
  }
  
  return (
    <Link 
      to={`/inventory/${collectible.id}/edit`}
      onMouseEnter={handleMouseEnter}
    >
      {collectible.name}
    </Link>
  )
}
```

### Invalidating Queries After Navigation

```tsx
const navigate = useNavigate()
const queryClient = useQueryClient()

const handleDelete = async () => {
  await deleteCollectible(id)
  
  // Invalidate list queries
  await queryClient.invalidateQueries({ queryKey: ['collectibles'] })
  
  // Navigate back to list
  navigate('/inventory')
}
```

## URL Structure Best Practices

### ✅ Good URL Patterns

```
/inventory                          // List view
/inventory?category=cards           // Filtered list
/inventory/123                      // Detail view
/inventory/123/edit                 // Edit form
/inventory/new                      // Create form
/vendors/acme-corp                  // Vendor detail (slug)
/vendors/acme-corp/items            // Nested resource
```

### ❌ Avoid These Patterns

```
/inventory?id=123                   // Use path param, not query
/edit-inventory/123                 // Inconsistent naming
/inventory/123/edit?id=456          // Redundant param
```

## Example: Complete CRUD Flow

```tsx
// List Page: /inventory
function CollectiblesListPage() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  
  const { data } = useQuery({
    queryKey: ['collectibles', category],
    queryFn: () => fetchCollectibles({ category })
  })
  
  return (
    <div>
      {data?.map(item => (
        <Link key={item.id} to={`/inventory/${item.id}/edit`}>
          {item.name}
        </Link>
      ))}
    </div>
  )
}

// Edit Page: /inventory/:collectibleId/edit
function CollectibleEditPage() {
  const { collectibleId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data } = useQuery({
    queryKey: ['collectible', collectibleId],
    queryFn: () => fetchCollectible(collectibleId)
  })
  
  const mutation = useMutation({
    mutationFn: (formData) => updateCollectible(collectibleId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectibles'] })
      queryClient.invalidateQueries({ queryKey: ['collectible', collectibleId] })
      navigate('/inventory')
    }
  })
  
  return <form onSubmit={mutation.mutate}>...</form>
}
```

## Testing URLs Locally

1. **Start Backend**: `cd backend && ./run-dev.sh` → http://localhost:4000
2. **Start Frontend**: `cd frontend && npm run dev` → http://localhost:3000
3. **Test Routes**:
   - http://localhost:3000/ → Inventory list
   - http://localhost:3000/dashboard → Dashboard (requires auth)
   - http://localhost:3000/inventory/123/edit → Edit form (if item 123 exists)
   - http://localhost:3000/inventory?category=cards → Filtered list

## Common Hooks Reference

```tsx
import { 
  useParams,           // Get URL path parameters
  useSearchParams,     // Get/set query parameters
  useNavigate,         // Programmatic navigation
  useLocation,         // Current location object
  Link,                // Declarative navigation
  Navigate             // Redirect component
} from 'react-router-dom'
```

---

**Last Updated**: November 24, 2025  
**React Router Version**: 6.26.1

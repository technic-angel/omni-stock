# Technical Decisions & Architecture Rationale

This document explains the key architectural and technical decisions made in building Omni-Stock, including the trade-offs considered and why specific patterns were chosen over alternatives.

---

## 1. Service/Selector Pattern (Backend)

### Decision
Implemented a strict **Service/Selector pattern** to separate read and write operations, instead of Django's default "fat views" or "fat models" approach.

### Structure
```
backend/<domain>/
  services/          # Write operations (create, update, delete)
    create_item.py
    update_item.py
    delete_item.py
  selectors/         # Read operations (get, list, filter)
    get_item.py
    list_items.py
```

### Why This Pattern?

**Problem with Django's Default Approach:**
- Business logic ends up in views (tight coupling to HTTP layer)
- Models become bloated with business methods
- Serializers grow to include validation + business logic
- Testing requires mocking HTTP requests
- Logic is difficult to reuse outside the view context

**Benefits of Service/Selector:**
1. **Separation of Concerns**: Each layer has ONE job
   - Views: HTTP routing and response formatting
   - Serializers: Data validation and schema definition
   - Services: Business logic for state changes
   - Selectors: Query logic and data retrieval

2. **Easier Testing**: Services and selectors are pure Python functions
   ```python
   # Easy to test - no HTTP mocking needed
   def test_create_item():
       item = create_item(data={'name': 'Test', 'user': user})
       assert item.name == 'Test'
   ```

3. **Reusability**: Logic can be called from:
   - API views
   - Management commands
   - Background tasks (Celery)
   - Other services
   - Admin actions

4. **Scalability**: Clear boundaries make it easier to:
   - Extract to microservices later
   - Add caching layers
   - Implement async operations
   - Add event sourcing

### Trade-offs Accepted
- ❌ More files (one file per operation)
- ❌ Steeper learning curve for Django beginners
- ❌ More boilerplate upfront
- ✅ Long-term maintainability
- ✅ Easier onboarding for larger teams
- ✅ Production-ready architecture

### When NOT to Use This Pattern
- Simple CRUD-only apps with no business logic
- Prototypes or throwaway projects
- Teams unfamiliar with DDD principles

---

## 2. React Query for State Management

### Decision
Used **React Query** (TanStack Query) for server state instead of Redux, Redux Toolkit, or Context API.

### Why React Query?

**The Problem:**
- Most app state is **server state** (data from APIs), not client state
- Redux treats server data like local data (requires manual cache invalidation)
- Fetching, caching, synchronizing, and updating server data is boilerplate-heavy in Redux

**React Query Advantages:**

1. **Automatic Caching**
   ```tsx
   const { data } = useCollectibles() // Cached automatically
   ```

2. **Background Refetching**
   - Stale-while-revalidate pattern
   - Auto-refresh on window focus
   - Configurable polling

3. **Optimistic Updates**
   ```tsx
   const { mutate } = useCreateCollectible({
     onMutate: async (newItem) => {
       // Show immediately in UI
       await queryClient.cancelQueries(['collectibles'])
       queryClient.setQueryData(['collectibles'], old => [...old, newItem])
     }
   })
   ```

4. **Less Boilerplate**
   - No reducers, actions, or action creators
   - No manual loading/error state management
   - Automatic request deduplication

**Comparison Table:**

| Feature | React Query | Redux Toolkit | Context API |
|---------|-------------|---------------|-------------|
| Server state caching | ✅ Built-in | ❌ Manual | ❌ Manual |
| Loading states | ✅ Automatic | ⚠️ Boilerplate | ❌ Manual |
| Error handling | ✅ Automatic | ⚠️ Boilerplate | ❌ Manual |
| Refetching | ✅ Automatic | ❌ Manual | ❌ Manual |
| Optimistic updates | ✅ Easy | ⚠️ Complex | ❌ Very hard |
| DevTools | ✅ Excellent | ✅ Excellent | ❌ Limited |
| Learning curve | ⚠️ Moderate | ❌ Steep | ✅ Easy |

### When NOT to Use React Query
- Apps with mostly client-side state (forms, UI toggles)
- Need for complex cross-component state orchestration
- Apps without API calls

### What About Context API?
Still used for:
- Authentication state (token storage)
- Theme preferences
- Simple UI state that doesn't need caching

---

## 3. Domain-Driven Design (Backend)

### Decision
Organized backend into **domain modules** (`users/`, `vendors/`, `inventory/`) instead of Django's default app-per-feature approach.

### Why DDD?

**Traditional Django Structure Problem:**
```
myapp/
  models.py       # All models in one file
  views.py        # All views in one file
  serializers.py  # All serializers in one file
```
This breaks down at scale (each file becomes 1000+ lines).

**DDD Structure:**
```
backend/
  users/          # User domain - authentication, profiles
  vendors/        # Vendor domain - vendor management
  inventory/      # Inventory domain - collectibles, items
  core/           # Shared utilities
```

**Benefits:**
1. **Clear Boundaries**: Each domain is self-contained
2. **Team Scalability**: Different teams can own different domains
3. **Cognitive Load**: Developers only need to understand one domain at a time
4. **Microservices Ready**: Easy to extract domains into separate services

### Trade-offs
- ❌ More directories
- ❌ Requires upfront domain modeling
- ✅ Scales to large teams
- ✅ Enforces bounded contexts

---

## 4. TypeScript + Zod for Forms

### Decision
Used **React Hook Form + Zod** instead of Formik, plain React state, or uncontrolled forms.

### Why This Combo?

**React Hook Form:**
- Uncontrolled inputs (better performance)
- Built-in validation
- Minimal re-renders

**Zod:**
- Type-safe schema validation
- Runtime validation
- Inferred TypeScript types

**Example:**
```tsx
const collectibleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0),
  price: z.number().optional()
})

type CollectibleInput = z.infer<typeof collectibleSchema> // Auto-typed!

const { register, handleSubmit } = useForm<CollectibleInput>({
  resolver: zodResolver(collectibleSchema)
})
```

**Benefits:**
- Single source of truth for validation logic
- Frontend and backend can share schemas (with zod-to-json-schema)
- TypeScript type safety end-to-end

---

## 5. Docker + Docker Compose for Development

### Decision
Required Docker for local development instead of virtual environments.

### Why?

**Problems with Virtualenv-Only:**
- "Works on my machine" issues
- Database version mismatches
- Environment variable management
- Onboarding new developers takes hours

**Docker Benefits:**
1. **Parity**: Dev environment matches production
2. **Fast Onboarding**: `make dev-up` and you're running
3. **Isolation**: No conflicts with other projects
4. **Services**: Database, Redis, etc. all configured

**Trade-offs:**
- ❌ Requires Docker knowledge
- ❌ Slower on non-Linux systems
- ✅ Production parity
- ✅ Team consistency

---

## 6. Supabase for Image Storage

### Decision
Used **Supabase Storage** instead of AWS S3, Cloudinary, or local filesystem.

### Why Supabase?

**Comparison:**

| Feature | Supabase | AWS S3 | Cloudinary |
|---------|----------|--------|------------|
| Free tier | ✅ 1GB | ✅ 5GB | ✅ 25GB |
| Setup complexity | ✅ Easy | ❌ Complex | ✅ Easy |
| Image transformation | ⚠️ Limited | ❌ No | ✅ Excellent |
| PostgreSQL integration | ✅ Yes | ❌ No | ❌ No |
| Auth integration | ✅ Built-in | ❌ Manual | ❌ Manual |

**Why Supabase Won:**
- Already using Supabase for potential future features (real-time, auth)
- Simple JavaScript SDK
- Row-level security policies
- Free tier sufficient for MVP

**Future Consideration:**
If image transformations become critical (resizing, optimization), migrate to Cloudinary.

---

## 7. Render + Vercel Deployment

### Decision
- **Backend**: Render
- **Frontend**: Vercel

### Why Not Alternatives?

**Heroku:**
- ❌ Expensive ($7/month minimum)
- ❌ Declining ecosystem
- ✅ Easy setup

**AWS/DigitalOcean:**
- ❌ Requires DevOps knowledge
- ❌ More configuration
- ✅ Full control
- ✅ Cheaper at scale

**Render + Vercel:**
- ✅ Free tiers for side projects
- ✅ Git-based deployments
- ✅ Automatic preview environments
- ✅ HTTPS by default
- ⚠️ Limited control
- ⚠️ Cold starts on free tier

**Decision Rationale:**
For an MVP/portfolio project, ease of deployment and free tier outweigh the lack of control. Can migrate to AWS/GCP when scaling requires it.

---

## 8. Pytest Over Django's TestCase

### Decision
Used **pytest + pytest-django** instead of Django's built-in `TestCase`.

### Why?

**Pytest Advantages:**
1. **Fixtures**: Reusable test setup with `@pytest.fixture`
2. **Parametrization**: Test multiple inputs easily
3. **Better Assertions**: `assert x == y` vs `self.assertEqual(x, y)`
4. **Plugin Ecosystem**: pytest-cov, pytest-xdist, etc.

**Example:**
```python
# Django TestCase - verbose
class CollectibleTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(...)
    
    def test_create(self):
        self.assertEqual(item.name, "Test")

# Pytest - clean
@pytest.fixture
def user(db):
    return User.objects.create(...)

def test_create(user):
    item = create_item(data={'name': 'Test', 'user': user})
    assert item.name == "Test"
```

---

## 9. Vite Over Create React App

### Decision
Used **Vite** for frontend build instead of Create React App (CRA) or Next.js.

### Why?

**CRA Problems:**
- Slow dev server (Webpack)
- No longer actively maintained
- Bundle size issues

**Next.js:**
- ✅ Server-side rendering
- ❌ Overkill for SPA
- ❌ Adds backend complexity

**Vite:**
- ✅ Lightning-fast HMR (Hot Module Replacement)
- ✅ Modern ESM-based builds
- ✅ Smaller bundles
- ✅ Simple config
- ⚠️ Newer (less mature ecosystem)

**Benchmark:**
- CRA dev server start: ~15 seconds
- Vite dev server start: ~0.5 seconds

---

## Summary: When These Patterns Make Sense

| Pattern | Good For | Avoid If |
|---------|----------|----------|
| Service/Selector | Complex business logic, large teams | Simple CRUD, solo projects |
| React Query | API-heavy apps | Mostly client state |
| DDD | Multi-domain apps, scaling | Single-domain apps |
| Docker | Team projects, production parity | Solo dev, simple apps |
| Zod + RHF | Complex forms, type safety | Simple forms |

---

## Future Improvements & Known Limitations

### Backend
- **No async views**: Django views are sync. Consider Django Ninja or FastAPI for async.
- **No caching layer**: Add Redis for list endpoints when data grows.
- **No background jobs**: Will need Celery for bulk imports, email sending.

### Frontend
- **No SSR**: Consider Next.js if SEO becomes important.
- **No real-time updates**: Add WebSockets for live inventory sync.
- **No offline support**: Add service workers for PWA functionality.

### Infrastructure
- **No CDN**: Add CloudFlare for static asset delivery.
- **No monitoring**: Add Sentry for error tracking.
- **No load testing**: Need to benchmark at scale (10k+ items).

---

This document will be updated as new decisions are made and patterns evolve.

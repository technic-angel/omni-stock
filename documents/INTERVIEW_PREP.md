# Interview Preparation Guide

This document contains detailed answers to common technical interview questions about Omni-Stock's architecture and implementation.

---

## Core Technical Questions

### Q1: "Walk me through your decision to use the service/selector pattern instead of Django's standard views."

**Answer:**

"When I started building Omni-Stock, I knew from the beginning I wanted vendor-scoped permissions and complex business logic around inventory management. I've seen codebases where business logic ends up scattered between views, serializers, and models, making it really hard to test and maintain.

The service/selector pattern solves this by creating a clear separation:

**Services handle writes** - When you create or update an item, there's validation logic, permission checks, and sometimes related object creation. For example, when creating a collectible with card details, I need to:
1. Validate the image URL format
2. Check vendor permissions
3. Create the collectible in a transaction
4. Optionally create nested card details
5. Handle any errors

If that lived in a view, I'd have to mock HTTP requests just to test it. But as a service function, I can just call `create_item(data={...})` in my tests.

**Selectors handle reads** - They encapsulate query logic. My `list_items` selector handles vendor scoping and filtering:
```python
def list_items(*, user, filters=None):
    qs = Collectible.objects.select_related('vendor', 'user')
    from backend.core.permissions import resolve_user_vendor
    vendor = resolve_user_vendor(user)
    if vendor:
        qs = qs.filter(vendor=vendor)
    if filters:
        # Apply filters...
    return qs
```

This way, the ViewSet just says 'give me items for this user' without knowing HOW that scoping works.

**The trade-off**: More files. Instead of one `views.py`, I have `services/create_item.py`, `services/update_item.py`, etc. For a simple CRUD app, this would be overkill. But for Omni-Stock's multi-vendor architecture, it's essential.

**Why not Django's default?** Django's default pattern works great for simple apps, but when you add:
- Complex permissions (vendor scoping)
- Nested object creation (collectibles + card details)
- Future features like bulk imports or async operations

...you need business logic that's reusable outside of HTTP requests. Services give you that."

---

### Q2: "Why did you choose React Query over Redux or Context API?"

**Answer:**

"This came down to understanding what kind of state I was managing. Omni-Stock is data-driven - almost everything comes from the API. User creates an item → API call. User views their list → API call. User deletes → API call.

**The problem with Redux for this**: Redux treats server data like local data. You have to manually:
- Track loading states (`isLoading`, `isError`)
- Handle cache invalidation ('did someone else update this item?')
- Deduplicate requests (if two components request the same data)
- Implement refetching logic

I built a small version with Redux first, and just the 'create item' flow required:
- An action creator
- A reducer case for REQUEST/SUCCESS/FAILURE
- Manual cache invalidation in the list reducer
- Loading state management

With React Query, the same flow is:
```tsx
const { mutate, isPending, error } = useCreateCollectible({
  onSuccess: () => {
    queryClient.invalidateQueries(['collectibles'])
  }
})
```

React Query automatically:
- Caches responses by query key
- Deduplicates simultaneous requests
- Refetches on window focus
- Handles loading/error states
- Provides optimistic updates

**Context API?** I still use Context for auth state (JWT token), because that's true client state that multiple components need. But for server data, Context has no caching, no refetching, and you'd rebuild everything React Query gives you.

**The turning point**: When I implemented the inventory list with filters, React Query automatically cached each filter combination. In Redux, I would've had to design a cache invalidation strategy myself.

**Trade-off**: React Query is another library to learn (4.5k GitHub stars, mature ecosystem). But it saved me from writing thousands of lines of state management boilerplate.

**When I wouldn't use it**: If the app was mostly client-side state (like a drawing tool or game), Redux would make more sense. But for a CRUD app hitting APIs? React Query is the right choice."

---

### Q3: "Show me a bug you debugged. What was the process?"

**Real Story - Render Deployment 404 Error:**

"When I first deployed to Render for PR previews, the backend would deploy successfully but return a 404 on the root URL. Here's how I debugged it:

**1. Reproduced the issue**
- Checked the Render logs: No errors, gunicorn started successfully
- Hit the `/health/` endpoint: Worked fine
- Hit `/api/collectibles/`: Worked fine
- Hit `/`: 404 error

**2. Formed a hypothesis**
Django was running, but the root URL route wasn't configured. I checked `backend/omni_stock/urls.py`:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('health/', health_view),
    # No root path!
]
```

**3. Why did this matter?**
Render health checks were hitting the root URL. For a recruiter or hiring manager, visiting `myapp.onrender.com` showed a 404 instead of useful API information.

**4. Solution**
I added a root view that returns JSON with API documentation:
```python
def root_view(request):
    return JsonResponse({
        'message': 'Omni-Stock API',
        'version': '1.0',
        'endpoints': {
            'api': '/api/',
            'docs': '/api/docs/',
            'admin': '/admin/',
            'health': '/health/'
        }
    })
```

**5. Tested locally first**
```bash
docker-compose exec backend python manage.py shell
>>> from django.test import Client
>>> c = Client()
>>> r = c.get('/')
>>> r.status_code
200
```

**6. Pushed, verified on Render**

**What I learned:**
- Always test deployment URLs before sending to others
- Root endpoints should return helpful information, not 404s
- Health check endpoints need to be configured for the hosting provider's expectations

**Other bug example - DisallowedHost Error:**

Earlier, Render returned a 400 error. Checked logs:
```
DisallowedHost: 'omni-stock-pr-37.onrender.com'
```

Django's `ALLOWED_HOSTS` setting rejected Render's preview URL. I had hardcoded localhost:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

**Solution**: Auto-detect Render environment variables:
```python
_render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if _render_host:
    ALLOWED_HOSTS.append(_render_host)
    ALLOWED_HOSTS.append('.onrender.com')  # Wildcard for PR previews
```

**Process:**
1. Read error logs (Render provides real-time logs)
2. Reproduce locally (set `RENDER_EXTERNAL_HOSTNAME` in `.env`)
3. Research Django's `ALLOWED_HOSTS` behavior
4. Implement fix with wildcard support for preview URLs
5. Test with `docker-compose exec backend python manage.py check --deploy`
6. Push and verify

This taught me to think about **dynamic environments** - PR previews have different URLs than production."

---

## Additional Interview Questions

### Q4: "Why TypeScript instead of JavaScript?"

**Answer:**

"Type safety catches bugs at compile time instead of runtime. For example, the API returns collectibles with this shape:
```tsx
interface Collectible {
  id: number
  name: string
  quantity: number
  vendor?: Vendor
}
```

If I accidentally try to access `item.quanity` (typo), TypeScript errors immediately:
```
Property 'quanity' does not exist. Did you mean 'quantity'?
```

In JavaScript, this would be a runtime bug that only shows up when a user loads the page.

**Where TypeScript saved me:**
- Form validation schemas with Zod generate TypeScript types automatically
- API response types catch backend/frontend contract mismatches
- Refactoring is safe - rename a property, and TypeScript shows every place it needs to change

**Trade-off**: Longer setup time, requires understanding of generics and type inference. But for a project I'll maintain long-term, it's worth it."

---

### Q5: "How do you handle authentication?"

**Answer:**

"JWT token-based authentication with Django REST Framework's TokenAuthentication.

**Flow:**
1. User registers → Backend creates user + auth token
2. Frontend stores token in localStorage (via `tokenStore.ts`)
3. Every API request includes `Authorization: Token <token>` header
4. Backend validates token, attaches `request.user`

**Why not sessions?** Stateless - easier to scale horizontally, works across domains (frontend on Vercel, backend on Render).

**Why not OAuth?** MVP doesn't need Google/GitHub login. Will add later if users request it.

**Security considerations:**
- Tokens stored in localStorage (vulnerable to XSS, but acceptable for MVP)
- Production would use httpOnly cookies + CSRF tokens
- HTTPS enforced in production (CORS settings require `https://`)

**Code:**
```tsx
// Frontend
const login = async (credentials) => {
  const { data } = await http.post('/api/token/', credentials)
  tokenStore.setAccess(data.token)
  setAccessToken(data.token)
}

// Backend
class CollectibleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # Requires token
```

---

### Q6: "How would you add real-time updates to the inventory list?"

**Answer:**

"Currently, the list only updates when you create/delete an item locally. If another user adds an item, you won't see it until you refresh.

**Solution: WebSockets with Django Channels**

1. **Backend**: Add Django Channels for WebSocket support
   ```python
   # consumers.py
   class InventoryConsumer(AsyncWebsocketConsumer):
       async def connect(self):
           await self.channel_layer.group_add("inventory", self.channel_name)
       
       async def inventory_updated(self, event):
           await self.send(json.dumps(event['data']))
   ```

2. **Trigger on changes**: In `create_item` service, broadcast:
   ```python
   from channels.layers import get_channel_layer
   
   channel_layer = get_channel_layer()
   await channel_layer.group_send('inventory', {
       'type': 'inventory_updated',
       'data': {'action': 'created', 'item': item.id}
   })
   ```

3. **Frontend**: Connect WebSocket, invalidate React Query cache:
   ```tsx
   useEffect(() => {
     const ws = new WebSocket('ws://localhost:8000/ws/inventory/')
     ws.onmessage = (event) => {
       queryClient.invalidateQueries(['collectibles'])
     }
   }, [])
   ```

**Alternative: Server-Sent Events (SSE)** - Simpler, one-way updates, no need for Channels.

**Trade-off**: WebSockets add infrastructure complexity (Redis for channel layer). For MVP, manual refresh is acceptable. Would implement for v2 if users request it."

---

### Q7: "How do you handle database migrations in production?"

**Answer:**

"Currently using Django's built-in migrations, deployed via Render's build script:
```bash
#!/bin/bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

**For MVP**: This works because:
- Small dataset (no long-running migrations)
- Low traffic (can afford brief downtime)

**For production at scale**, I'd implement:
1. **Blue-green deployments**: Run migrations on new instances before switching traffic
2. **Backwards-compatible migrations**: 
   - Add column as nullable first
   - Deploy code that works with/without new column
   - Backfill data
   - Make column non-nullable
   - Remove old code
3. **Migration testing**: Test on a copy of production data
4. **Rollback plan**: Keep migrations reversible with `migrations.RunPython` reverse operations

**Example of dangerous migration:**
```python
# DON'T: Blocks table during backfill
operations = [
    migrations.AddField('collectible', 'search_vector', models.TextField())
]

# DO: Add nullable, backfill later
operations = [
    migrations.AddField('collectible', 'search_vector', models.TextField(null=True))
]
# Then: Run `UPDATE collectible SET search_vector = ...` in batches
```

**Render specifics**: Migrations run during build, before traffic switches. Zero-downtime for additive changes."

---

### Q8: "Why not use Next.js for the frontend?"

**Answer:**

"Next.js would've given me SSR (server-side rendering) and API routes, but Omni-Stock is a **private dashboard** - users must log in to see anything.

**SSR benefits:**
- SEO (not relevant - no public pages)
- Fast initial load (less important for authenticated apps)

**Vite SPA benefits:**
- Simpler deployment (static files to Vercel)
- Faster dev server (<1s vs 5-10s)
- No server runtime needed
- Easier to reason about (no hydration issues)

**When I'd use Next.js:**
- Public marketing pages with SEO requirements
- E-commerce site (product pages need SEO)
- Blog or content site

For a CRUD dashboard? Vite is the pragmatic choice."

---

### Q9: "How would you implement search?"

**Answer:**

"Currently using Django's `icontains` filter:
```python
if 'search' in filters:
    qs = qs.filter(name__icontains=filters['search'])
```

This is slow on large datasets (no index on `LIKE` queries).

**Phase 1 (Current scale)**: PostgreSQL `pg_trgm` extension for trigram similarity:
```python
from django.contrib.postgres.search import TrigramSimilarity

qs = qs.annotate(
    similarity=TrigramSimilarity('name', search_query)
).filter(similarity__gt=0.3).order_by('-similarity')
```

Add GIN index:
```sql
CREATE INDEX collectible_name_trgm_idx ON collectible 
USING GIN (name gin_trgm_ops);
```

**Phase 2 (10k+ items)**: Full-text search with `tsvector`:
```python
from django.contrib.postgres.search import SearchVector, SearchQuery

qs = qs.annotate(
    search=SearchVector('name', 'description')
).filter(search=SearchQuery(search_query))
```

**Phase 3 (100k+ items)**: Elasticsearch for advanced features:
- Autocomplete
- Fuzzy matching
- Relevance scoring
- Faceted search (filter by category + condition)

**Trade-off**: Elasticsearch adds infrastructure complexity. Only worth it when PostgreSQL full-text search becomes a bottleneck."

---

### Q10: "How do you ensure data consistency with vendor scoping?"

**Answer:**

"Vendor scoping is enforced at three levels:

**1. Permission Layer** (`VendorScopedPermission`):
```python
class VendorScopedPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user_vendor = resolve_user_vendor(request.user)
        if user_vendor and obj.vendor != user_vendor:
            return False  # Can't access other vendor's items
        return True
```

**2. Selector Layer** (`list_items`):
```python
def list_items(*, user, filters=None):
    qs = Collectible.objects.all()
    vendor = resolve_user_vendor(user)
    if vendor:
        qs = qs.filter(vendor=vendor)  # Auto-scope to user's vendor
    return qs
```

**3. Service Layer** (`create_item`):
```python
def create_item(*, data, user):
    vendor = resolve_user_vendor(user)
    if vendor:
        if data.get('vendor') and data['vendor'] != vendor:
            raise PermissionDenied('Cannot create item for another vendor')
        data['vendor'] = vendor
    # Create item...
```

**Why three layers?**
- **Permissions**: Prevent unauthorized API access
- **Selectors**: Prevent data leakage (you won't even see other vendor's items in lists)
- **Services**: Prevent creating data for wrong vendor

**Database constraint** (future):
```python
class Meta:
    constraints = [
        models.CheckConstraint(
            check=Q(vendor__isnull=True) | Q(vendor=F('user__profile__vendor')),
            name='collectible_vendor_matches_user_vendor'
        )
    ]
```

This would enforce consistency at the DB level, catching any bugs in application logic."

---

## Debugging Process & Approach

### General Debugging Framework

**1. Reproduce Reliably**
- Can I trigger the bug consistently?
- What's the minimum steps to reproduce?

**2. Gather Data**
- Server logs (Django console output, Render logs)
- Browser console errors
- Network tab (API responses)
- Database state (Django shell)

**3. Form Hypothesis**
- What's the most likely cause?
- Have I seen something similar before?

**4. Test Hypothesis**
- Add print statements / debugger breakpoints
- Test in isolation (unit test for the suspected function)

**5. Implement Fix**
- Fix the root cause, not symptoms
- Add test to prevent regression

**6. Verify**
- Test locally
- Deploy to staging/preview
- Confirm bug is gone

**Example Debugging Session:**

*Bug*: Users can see other vendor's collectibles in the list.

*Reproduce*: Create two users with different vendors, log in as User A, see User B's items.

*Gather*: Check API response - returns items from both vendors.

*Hypothesis*: Selector isn't filtering by vendor.

*Test*:
```python
def test_list_items_scopes_by_vendor(user_with_vendor, other_vendor):
    vendor = resolve_user_vendor(user_with_vendor)
    item1 = create_item(data={'vendor': vendor, ...})
    item2 = create_item(data={'vendor': other_vendor, ...})
    
    items = list_items(user=user_with_vendor)
    assert item1 in items
    assert item2 not in items  # FAILS - bug confirmed
```

*Fix*:
```python
def list_items(*, user, filters=None):
    qs = Collectible.objects.all()
    vendor = resolve_user_vendor(user)
    if vendor:
        qs = qs.filter(vendor=vendor)  # Add this line
    return qs
```

*Verify*: Test passes, manual test shows correct scoping.

---

## Red Flags to Avoid in Interviews

### ❌ Don't Say:
- "I used this pattern because it's best practice" (without explaining WHY)
- "I just followed a tutorial" (shows no independent thinking)
- "I haven't really tested it" (no quality focus)
- "AI generated most of it" (even if true)

### ✅ Do Say:
- "I chose X over Y because [specific reason]"
- "I considered [alternatives], but [trade-off]"
- "Here's a bug I debugged and what I learned"
- "I'd improve this by [specific enhancement]"

---

## Final Advice

**Be honest about AI assistance:**
"I used AI tools like GitHub Copilot for boilerplate and syntax, but all architectural decisions and debugging were mine. AI suggested patterns, but I evaluated them and chose what fit my use case."

**Show growth:**
"This is the most complex project I've built solo. I learned [X, Y, Z]. Here's what I'd do differently next time."

**Demonstrate understanding:**
Don't just say "I used React Query" - explain WHY you chose it over alternatives, and when you WOULDN'T use it.

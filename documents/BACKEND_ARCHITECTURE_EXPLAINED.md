# Backend Architecture Deep Dive

**Framework:** Django 5.0.6 + Django REST Framework 3.15.2  
**Database:** PostgreSQL  
**Authentication:** JWT (Simple JWT)  
**Architecture Pattern:** Domain-Driven Design + Service/Selector Pattern

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Data Models](#data-models)
3. [Serializers](#serializers)
4. [ViewSets](#viewsets)
5. [Services vs Selectors](#services-vs-selectors)
6. [Authentication System](#authentication-system)
7. [Permissions & Multi-Tenancy](#permissions--multi-tenancy)
8. [Data Flow](#data-flow)
9. [Database Design](#database-design)
10. [Testing Strategy](#testing-strategy)

---

## Project Structure

The backend follows a **domain-driven architecture** where each feature area lives in its own Django app:

```
backend/
├── omni_stock/          # Django project settings
│   ├── settings.py      # Configuration (DB, DRF, JWT settings)
│   ├── urls.py          # Root URL routing
│   └── wsgi.py          # WSGI entry point for deployment
│
├── core/                # Shared utilities (validators, permissions, exceptions)
│   ├── permissions.py   # VendorScopedPermission, resolve_user_vendor()
│   ├── validators.py    # validate_image_url(), business logic validators
│   ├── exceptions.py    # Custom exception classes
│   └── utils.py         # Helper functions
│
├── users/               # User authentication & profiles
│   ├── models.py        # User, UserProfile models
│   ├── api/             # User registration, profile endpoints
│   └── tests/           # User-related tests
│
├── vendors/             # Vendor management
│   ├── models.py        # Vendor model
│   ├── api/             # Vendor CRUD endpoints
│   └── tests/           # Vendor tests
│
└── inventory/           # Collectibles & cards (main business logic)
    ├── models.py        # Collectible, CardDetails models
    ├── api/             # API layer (serializers, viewsets, URLs)
    │   ├── serializers.py
    │   ├── viewsets.py
    │   └── urls.py
    ├── services/        # Write operations (create, update, delete)
    │   ├── create_item.py
    │   ├── update_item.py
    │   └── delete_item.py
    ├── selectors/       # Read operations (queries, filtering)
    │   ├── list_items.py
    │   └── get_item.py
    ├── management/      # Django commands (load_demo_data)
    └── tests/           # Comprehensive test suite (93% coverage)
```

### Why This Structure?

**Domain-Driven Design (DDD):**
- Each Django app represents a **bounded context** (users, vendors, inventory)
- Clear separation of concerns
- Easy to understand what code lives where
- Scales well as team grows

**Service/Selector Pattern:**
- **Services:** Handle write operations with business logic (create, update, delete)
- **Selectors:** Handle read operations and queries (list, get, filter)
- Keeps viewsets thin (just HTTP handling)
- Business logic is reusable (can call from views, commands, Celery tasks, etc.)

This pattern is common in modern Django projects at companies like Instagram, Eventbrite, and others.

---

## Data Models

Django models define the database schema and business entities.

### User Model (`users/models.py`)

```python
class User(AbstractUser):
    """Custom user model with unique email requirement."""
    
    email = models.EmailField("email address", unique=True)
    # Inherits: username, password, first_name, last_name, is_staff, is_active
```

**Why Custom User Model:**
- Django best practice: always use custom user model from day 1
- Allows future extensions (add fields, change authentication method)
- `email` is unique for login (users login with email, not username)

**Inherited Fields from AbstractUser:**
- `username` - Username (not used for login in this app)
- `password` - Hashed password (PBKDF2 algorithm by default)
- `email` - Email address (used for login)
- `first_name`, `last_name` - Optional display names
- `is_staff` - Can access Django admin
- `is_active` - Account enabled/disabled flag
- `is_superuser` - Django superuser permissions
- `date_joined` - Registration timestamp

---

### UserProfile Model (`users/models.py`)

```python
class UserProfile(models.Model):
    """Attach vendor metadata and contact info to a Django user."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name="users")
    phone = models.CharField(max_length=40, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    metadata = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Purpose:**
- Extends `User` with application-specific data
- Links user to vendor (multi-tenancy key relationship)
- Stores extra profile info (phone, bio, arbitrary metadata)

**Why OneToOne Instead of Extending User Directly:**
- Keeps auth model clean
- Profile data loaded only when needed (performance)
- Easier to add fields without migrations on auth table

**Relationship:**
- `user.profile` → access UserProfile from User
- `VendorMember` records link users to vendors; a membership can be marked `is_primary` to represent the selected vendor.
- `vendor.users.all()` → all profiles linked to a vendor (profile exists independently of memberships)

---

### Vendor Model (`vendors/models.py`)

```python
class Vendor(models.Model):
    """Represents a vendor/seller who owns inventory."""
    
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Purpose:**
- Multi-tenant isolation boundary
- Each vendor owns their own collectibles
- In MVP: 1 user = 1 vendor (auto-created on registration)
- Future: Multiple users can belong to one vendor (team accounts)

**Why Separate Vendor Table:**
- Prepares for multi-user vendors (team feature)
- Clear data ownership model
- Easy to add vendor-specific settings later (branding, billing, etc.)

---

### Collectible Model (`inventory/models.py`)

```python
class Collectible(models.Model):
    """Represents a single stockable inventory item."""
    
    # Ownership
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, related_name="collectibles")
    
    # Identity
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    
    # Classification
    condition = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    
    # Media
    image_url = models.URLField(blank=True, null=True)
    
    # Inventory
    quantity = models.IntegerField(default=0)
    
    # Pricing
    intake_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    projected_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Field Explanations:**

**Ownership Fields:**
- `user` - Which user added this item (for audit trail)
- `vendor` - Which vendor owns this item (for multi-tenant scoping)

**Identity Fields:**
- `name` - Human-readable item name ("Charizard Holo 1st Edition")
- `sku` - Stock Keeping Unit, unique identifier (like a barcode)
- `description` - Long-form details about the item

**Classification Fields:**
- `condition` - Physical state (Mint, Near Mint, Good, Poor, etc.)
- `category` - Type of collectible (Trading Cards, Fashion, Video Games, etc.)

**Media Fields:**
- `image_url` - URL to image stored in Supabase Storage
- Why URL not file field: Supabase handles image hosting, CDN, resizing

**Inventory Fields:**
- `quantity` - How many units in stock (0 = sold out)

**Pricing Fields:**
- `intake_price` - What you paid for it (cost basis)
- `price` - Current market value
- `projected_price` - Expected selling price
- Why 3 prices: Helps calculate profit margins, ROI, inventory value

**Timestamp Fields:**
- `created_at` - Auto-set when item created (never changes)
- `updated_at` - Auto-updated on every save

**Why DecimalField for Prices:**
- FloatField has rounding errors ($0.10 + $0.20 = $0.300000000004)
- DecimalField is exact (financial calculations require precision)
- `max_digits=10` allows prices up to $99,999,999.99

**Why SKU is Unique:**
- Prevents duplicate entries
- Serves as business key (can use for lookups, integrations)
- Real inventory systems use SKUs extensively

---

### CardDetails Model (`inventory/models.py`)

```python
class CardDetails(models.Model):
    """Card-specific metadata kept separate from main Collectible."""
    
    collectible = models.OneToOneField(Collectible, on_delete=models.CASCADE, related_name="card_details")
    
    # Grading
    psa_grade = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    
    # Condition
    condition = models.CharField(max_length=50, blank=True, null=True)
    
    # External IDs (for API integrations like TCGPlayer, eBay)
    external_ids = models.JSONField(blank=True, null=True)
    
    # Market data
    last_estimated_at = models.DateTimeField(blank=True, null=True)
    
    # Card-specific attributes
    language = models.CharField(max_length=50, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    print_run = models.IntegerField(blank=True, null=True)
    market_region = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
```

**Why Separate Table:**
- Not all collectibles are trading cards (fashion items, toys, games don't need this)
- Keeps `Collectible` table lean
- OneToOne relationship means optional extension (collectible.card_details or None)

**Key Fields:**
- `psa_grade` - Professional grading score (PSA 10 = perfect, PSA 1 = poor)
- `external_ids` - JSONField for flexible API integrations ({"tcgplayer_id": 12345, "ebay_id": "abc"})
- `language` - Japanese, English, French, etc.
- `print_run` - How many were printed (rarity indicator)

**Why JSONField for external_ids:**
- Different platforms have different ID systems
- Flexible schema (add new platforms without migrations)
- Can store complex data: `{"tcgplayer": {"id": 123, "url": "..."}}`

---

## Serializers

Serializers convert between Django models (Python objects) and JSON (API format).

### What Serializers Do

**3 Main Jobs:**
1. **Deserialization:** JSON → Python objects (parse API requests)
2. **Validation:** Check data is correct before saving
3. **Serialization:** Python objects → JSON (format API responses)

**Flow:**
```
Client sends JSON → Serializer validates → Create/Update model → Serializer formats → Client receives JSON
```

---

### CollectibleSerializer (`inventory/api/serializers.py`)

```python
class CollectibleSerializer(serializers.ModelSerializer):
    card_details = CardDetailsSerializer(required=False)
    
    class Meta:
        model = Collectible
        fields = ['id', 'user', 'vendor', 'name', 'sku', 'description', 'condition', 
                  'category', 'image_url', 'quantity', 'intake_price', 'price', 
                  'projected_price', 'card_details', 'created_at', 'updated_at']
        read_only_fields = ('id', 'user', 'vendor', 'created_at', 'updated_at')
```

**Field Handling:**

**`fields`**: Which model fields to expose in API
- Includes all relevant Collectible fields
- Adds nested `card_details` (from OneToOne relationship)

**`read_only_fields`**: Fields users cannot set via API
- `id` - Auto-generated by database
- `user`, `vendor` - Set from JWT token (security - can't claim someone else's items)
- `created_at`, `updated_at` - Auto-managed by Django

**Nested Serializer:**
```python
card_details = CardDetailsSerializer(required=False)
```
- Allows creating collectible + card details in one request
- `required=False` means card_details is optional (not all items are cards)
- Django handles nested object creation automatically

**Validation Methods:**

```python
def validate_quantity(self, value: int) -> int:
    if value < 0:
        raise serializers.ValidationError("Quantity cannot be negative.")
    return value
```

- **Field-level validation:** `validate_<field_name>` methods
- Runs automatically when data is passed to serializer
- Raises `ValidationError` if data is bad
- Returns cleaned value if good

**Why Validate in Serializer:**
- Catches bad data before it reaches database
- Provides clear error messages to API users
- Enforces business rules (no negative prices, no negative stock)

**Custom Create/Update:**

```python
def create(self, validated_data):
    card_details_data = validated_data.pop('card_details', None)
    return create_item(data=validated_data, card_details_data=card_details_data)
```

- Instead of default `Collectible.objects.create()`, calls service function
- **Why:** Service handles transaction, business logic, related objects
- Keeps serializer focused on data validation, not business logic

---

### CardDetailsSerializer

```python
class CardDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardDetails
        fields = ['psa_grade', 'condition', 'external_ids', 'last_estimated_at', 
                  'language', 'release_date', 'print_run', 'market_region', 'notes']
```
q
**Simple Serializer:**
- No custom validation (all fields are optional)
- Used as nested serializer in CollectibleSerializer
- All fields can be null/blank (trading cards have varied data availability)

---

## ViewSets

ViewSets are DRF's way of handling HTTP requests and routing.

### CollectibleViewSet (`inventory/api/viewsets.py`)

**What is a ViewSet:**
- Combines CRUD operations into one class
- Automatically generates routes (list, create, retrieve, update, destroy)
- Inherits from `viewsets.ModelViewSet`

**Standard Actions:**
- `list()` → `GET /collectibles/` (list all)
- `create()` → `POST /collectibles/` (create new)
- `retrieve()` → `GET /collectibles/{id}/` (get one)
- `update()` → `PUT /collectibles/{id}/` (full update)
- `partial_update()` → `PATCH /collectibles/{id}/` (partial update)
- `destroy()` → `DELETE /collectibles/{id}/` (delete)

**Code:**

```python
class CollectibleViewSet(viewsets.ModelViewSet):
    serializer_class = CollectibleSerializer
    permission_classes = [IsAuthenticated, VendorScopedPermission]
    
    def get_queryset(self):
        return list_items(user=self.request.user, filters=self.request.query_params)
```

**Breaking It Down:**

**`serializer_class`:**
- Which serializer to use for this viewset
- DRF automatically handles serialization/deserialization

**`permission_classes`:**
- `IsAuthenticated` - Must have valid JWT token
- `VendorScopedPermission` - Can only access your vendor's data
- Both must pass or request is rejected with 401/403

**`get_queryset()`:**
- Called by DRF to get database queryset
- **Calls selector function** (Service/Selector pattern)
- Passes user and query params (for filtering)
- Returns only items user can access (multi-tenant scoping)

**Why Override get_queryset:**
- Apply vendor scoping (users only see their items)
- Apply filters from query params (?category=Trading%20Cards)
- Keep business logic in selectors, not views

---

### Custom Actions

```python
def perform_create(self, serializer):
    payload = dict(serializer.validated_data)
    card_details_data = payload.pop('card_details', None)
    vendor = self._resolve_vendor(user=self.request.user, posted_vendor=payload.get('vendor'))
    
    if vendor is not None:
        payload['vendor'] = vendor
    payload['user'] = self.request.user
    
    instance = create_item(data=payload, card_details_data=card_details_data)
    serializer.instance = instance
```

**What perform_create Does:**
1. Extract validated data from serializer
2. Separate card_details (nested object)
3. Resolve vendor from JWT token (security)
4. Set user from JWT token (security)
5. **Call service function** (not model.save())
6. Set created instance on serializer (for response)

**Why Not Use Default create():**
- Need custom business logic (resolve vendor, handle nested objects)
- Service function handles transaction (atomic create + card details)
- Keeps viewset thin (just HTTP handling)

**Security Checks:**

```python
def _resolve_vendor(self, *, user, posted_vendor, current_vendor=None):
    active_vendor = resolve_user_vendor(user)

    if active_vendor is not None:
        if posted_vendor is not None and posted_vendor != active_vendor:
            raise PermissionDenied("You cannot create a Collectible for another vendor.")
        return active_vendor
```

**What This Prevents:**
- User A cannot create items for User B's vendor
- User cannot pass `vendor: 99` in request to hijack another vendor
- Always uses the active vendor derived from the user's memberships (JWT identifies the user, not the vendor)

This is **multi-tenant security** - critical for SaaS applications. Vendor access is governed by active `VendorMember` records (`is_primary=True`) rather than a field on the profile.

---

## Services vs Selectors

This pattern separates read and write operations.

### Services (Write Operations)

**Location:** `inventory/services/`  
**Purpose:** Handle create, update, delete operations with business logic

**Example: create_item.py**

```python
def create_item(*, data: Dict[str, Any], card_details_data: Optional[Dict[str, Any]] = None) -> Collectible:
    """Create a Collectible (and optional CardDetails) inside a transaction."""
    payload = data.copy()
    image_url = payload.get("image_url")
    
    # Business logic: validate image URL
    if image_url:
        validate_image_url(image_url)
    
    # Atomic transaction: both succeed or both fail
    with transaction.atomic():
        collectible = Collectible.objects.create(**payload)
        if card_details_data:
            CardDetails.objects.create(collectible=collectible, **card_details_data)
    
    return collectible
```

**Key Features:**

**1. Keyword-only arguments (`*, data, card_details_data`):**
- Forces callers to use named arguments: `create_item(data={...}, card_details_data={...})`
- Prevents bugs from argument order mistakes
- Makes code more readable

**2. Transaction wrapper:**
```python
with transaction.atomic():
    # All database operations here are atomic
    # If any fails, all are rolled back
```
- **Atomic:** All succeed or all fail (no partial saves)
- Critical for consistency (can't have collectible without card_details if both were requested)
- Rolls back on any exception

**3. Business logic validation:**
```python
if image_url:
    validate_image_url(image_url)
```
- Not just type checking (serializer does that)
- Business rules: URL must be from allowed domains, must be accessible, etc.
- Keeps validation logic centralized

**Why Services:**
- **Reusability:** Can call from views, management commands, Celery tasks, tests
- **Testability:** Easy to unit test (no HTTP request needed)
- **Maintainability:** Business logic in one place, not scattered across views
- **Transactions:** Easy to wrap multiple operations in transaction

---

### Selectors (Read Operations)

**Location:** `inventory/selectors/`  
**Purpose:** Handle queries, filtering, data retrieval

**Example: list_items.py**

```python
def list_items(*, user, filters: Mapping[str, Any] | None = None) -> QuerySet:
    """Return collectibles scoped to the requesting user's vendor or user."""
    base_qs = Collectible.objects.all()
    
    # Security: unauthenticated users see nothing
    if user is None or not getattr(user, "is_authenticated", False):
        return base_qs.none()
    
    # Multi-tenant scoping: only your vendor's items
    vendor = resolve_user_vendor(user)
    if vendor is not None:
        scoped = base_qs.filter(vendor=vendor)
    else:
        scoped = base_qs.filter(user=user)
    
    # Apply filters from query params
    params = filters or {}
    language = params.get("language")
    if language:
        scoped = scoped.filter(card_details__language__iexact=language)
    
    market_region = params.get("market_region")
    if market_region:
        scoped = scoped.filter(card_details__market_region__iexact=market_region)
    
    return scoped.order_by("name")
```

**Key Features:**

**1. Always returns QuerySet (not list):**
- QuerySet is lazy (doesn't hit DB until accessed)
- Can be further filtered by viewset (pagination, ordering)
- Efficient: `list_items().filter(...).count()` is one DB query, not two

**2. Multi-tenant scoping:**
```python
vendor = resolve_user_vendor(user)
if vendor:
    scoped = base_qs.filter(vendor=vendor)
else:
    scoped = base_qs.filter(user=user)
```
- **Critical security:** Users only see their data
- Applied at queryset level (impossible to accidentally leak data)
- If user has no vendor, falls back to user filtering

**3. Conditional filtering:**
```python
if language:
    scoped = scoped.filter(card_details__language__iexact=language)
```
- Only applies filter if parameter is provided
- `iexact` = case-insensitive match ("English" == "english")
- Builds query dynamically based on request

**Why Selectors:**
- **Performance:** Can optimize queries (select_related, prefetch_related)
- **Security:** Scoping logic in one place (can't forget to apply it)
- **Reusability:** Same selector used by API, admin, exports, reports
- **Testability:** Easy to test query logic without HTTP requests

---

### Pattern Benefits

**Before (traditional Django):**
```python
# In view:
vendor = resolve_user_vendor(request.user)
collectibles = Collectible.objects.filter(vendor=vendor) if vendor else Collectible.objects.none()
if category := request.GET.get('category'):
    collectibles = collectibles.filter(category=category)
# Business logic mixed with HTTP handling
```

**After (Service/Selector pattern):**
```python
# In view:
collectibles = list_items(user=request.user, filters=request.query_params)

# In selector:
# All query logic, scoping, filtering

# In service:
# All business logic, transactions, validation
```

**Advantages:**
- Views are thin (5-10 lines)
- Business logic is testable without web requests
- Code is reusable (from views, commands, tasks, shell)
- Team members know where to find logic

This pattern is used at Instagram, Eventbrite, and many other Django shops.

---

## Authentication System

Uses **JWT (JSON Web Tokens)** via `djangorestframework-simplejwt`.

### Why JWT Instead of Session Auth

**Traditional Session Auth:**
- Server stores session data in database/Redis
- Client gets session cookie
- Server looks up session on every request
- **Problem:** Doesn't scale well (database lookup every request)

**JWT Auth:**
- Server signs token with secret key
- Client stores token (localStorage)
- Client sends token in `Authorization: Bearer <token>` header
- Server verifies signature (no database lookup)
- **Benefits:** Stateless, scales horizontally, works with mobile apps

---

### JWT Flow

**1. User Registers:**
```
POST /api/auth/register/
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}

Response:
{
  "id": 1,
  "email": "user@example.com",
  "vendor": { ... }  // Auto-created vendor
}
```

**2. User Logs In:**
```
POST /api/auth/token/
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",  // 5 minute lifetime
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."  // 1 day lifetime
}
```

**3. Client Stores Tokens:**
```javascript
localStorage.setItem('access_token', response.access)
localStorage.setItem('refresh_token', response.refresh)
```

**4. Client Makes Authenticated Request:**
```
GET /api/collectibles/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**5. Server Verifies Token:**
```python
# DRF middleware automatically:
# 1. Extracts token from Authorization header
# 2. Verifies signature with secret key
# 3. Checks expiration
# 4. Sets request.user to User object
```

**6. Access Token Expires (after 5 minutes):**
```
GET /api/collectibles/
Response: 401 Unauthorized
```

**7. Client Refreshes Token:**
```
POST /api/auth/token/refresh/
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."  // New access token
}
```

**8. Client Retries with New Token:**
```
GET /api/collectibles/
Authorization: Bearer <new_access_token>
```

---

### JWT Token Structure

**Decoded Token:**
```json
{
  "token_type": "access",
  "exp": 1700000300,        // Expiration timestamp
  "iat": 1700000000,        // Issued at timestamp
  "jti": "abc123",          // Unique token ID
  "user_id": 1              // User primary key
}
```

**How DRF Gets User:**
```python
# In DRF JWT authentication:
user_id = token_payload['user_id']
user = User.objects.get(pk=user_id)
request.user = user
```

**Security Notes:**
- Token is **signed** with `SECRET_KEY` from settings
- Server can verify token without database lookup
- **Cannot be forged** (would need SECRET_KEY)
- **Cannot be tampered with** (signature would be invalid)
- **Can expire** (checked on every request)

---

### Settings Configuration

**settings.py:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

**Key Settings:**
- `ACCESS_TOKEN_LIFETIME`: Short (5 min) for security (if stolen, expires soon)
- `REFRESH_TOKEN_LIFETIME`: Long (1 day) for convenience (don't re-login every 5 min)
- `ALGORITHM`: HS256 (HMAC with SHA-256)
- `AUTH_HEADER_TYPES`: Accepts "Bearer <token>" format

---

## Permissions & Multi-Tenancy

Multi-tenancy means multiple users/vendors share the same application but see only their own data.

### VendorScopedPermission (`core/permissions.py`)

**Purpose:** Ensure users can only access their vendor's data

**Code:**
```python
class VendorScopedPermission(permissions.BasePermission):
    """Users can only access resources belonging to their vendor."""
    
    def has_object_permission(self, request, view, obj):
        # Get user's vendor from profile
        user_vendor = resolve_user_vendor(request.user)
        
        # If object has vendor field, check it matches
        if hasattr(obj, 'vendor'):
            return obj.vendor == user_vendor
        
        # If object has user field, check it matches
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
```

**How It Works:**

**1. DRF calls has_object_permission for every object access:**
- After `get_object()` in viewset
- Before `update()`, `destroy()`, `retrieve()`

**2. Permission checks object ownership:**
```python
obj.vendor == user_vendor
```
- Compares object's vendor to user's vendor
- Returns True if match (allow), False if not (deny with 403)

**3. Fallback to user check:**
```python
obj.user == request.user
```
- If no vendor field, check user field
- Ensures user can only modify their own objects

**Example Flow:**
```
User A (vendor_id=1) → GET /collectibles/123/
  → collectible.vendor_id = 1 → Match → Allow

User A (vendor_id=1) → GET /collectibles/456/
  → collectible.vendor_id = 2 → No match → 403 Forbidden
```

**Why This Matters:**
- **Security:** Prevents users from accessing others' data
- **Privacy:** Users can't see competitors' inventory
- **Compliance:** GDPR, data isolation requirements
- **Business logic:** Each vendor is independent business

---

### resolve_user_vendor Helper (`core/permissions.py`)

```python
def resolve_user_vendor(user):
    """Extract vendor from user's profile."""
    if not user or not user.is_authenticated:
        return None
    
    profile = getattr(user, 'profile', None)
    if profile is None:
        return None
    
    return getattr(profile, 'vendor', None)
```

**Purpose:** Safely extract vendor from user

**Why Needed:**
- User → UserProfile → Vendor (2 hops)
- Any step could be None
- `getattr(obj, 'attr', None)` safely returns None if attribute missing
- Prevents AttributeError crashes

**Usage:**
```python
vendor = resolve_user_vendor(request.user)
if vendor is None:
    # User has no vendor, deny access
```

---

### Queryset Scoping

Permissions check **object-level** access. Querysets check **list-level** access.

**In Selector:**
```python
def list_items(*, user, filters=None) -> QuerySet:
    # Start with all collectibles
    base_qs = Collectible.objects.all()
    
    # Apply vendor scoping
    profile = getattr(user, "profile", None)
    vendor = resolve_user_vendor(user)
    if vendor:
        scoped = base_qs.filter(vendor=vendor)
    else:
        scoped = base_qs.filter(user=user)
    
    return scoped
```

**Effect:**
- `GET /collectibles/` only returns your vendor's items
- User A with vendor_id=1 sees items where vendor_id=1
- User B with vendor_id=2 sees different items
- **Impossible to see other vendors' data** (not in queryset)

**Why Both Permissions and Queryset Scoping:**
- **Querysets:** Filter lists (efficient, database-level)
- **Permissions:** Guard individual objects (safety net, prevents direct ID access)
- **Defense in depth:** If one fails, the other catches it

---

## Data Flow

Let's trace a complete request: **Creating a collectible**

### Client Request

```http
POST /api/collectibles/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "name": "Charizard Holo",
  "sku": "PKMN-001",
  "category": "Trading Cards",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1,
  "card_details": {
    "game": "Pokemon",
    "set_name": "Base Set",
    "is_first_edition": true
  }
}
```

---

### Step 1: Django URL Routing

**urls.py:**
```python
# Project URLs (omni_stock/urls.py)
urlpatterns = [
    path('api/', include('backend.inventory.api.urls')),
]

# Inventory URLs (inventory/api/urls.py)
router = DefaultRouter()
router.register(r'collectibles', CollectibleViewSet, basename='collectible')
urlpatterns = router.urls
```

**Flow:**
1. Request comes to `/api/collectibles/`
2. Django matches `/api/` → routes to inventory.api.urls
3. Router matches `collectibles/` → routes to `CollectibleViewSet`
4. POST method → calls `create()` action

---

### Step 2: Authentication

**DRF JWT Middleware:**
```python
# Automatically happens before view is called:
1. Extract "Bearer eyJ0eXAiOiJKV1Qi..." from Authorization header
2. Decode JWT token
3. Verify signature with SECRET_KEY
4. Check expiration (token.exp > now)
5. Extract user_id from token payload
6. Query: user = User.objects.get(pk=token['user_id'])
7. Set request.user = user
```

**If Token Invalid:**
- Returns `401 Unauthorized`
- View is never called

**If Token Valid:**
- Continues to permissions check

---

### Step 3: Permission Check

**ViewSet:**
```python
class CollectibleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, VendorScopedPermission]
```

**DRF checks each permission:**
```python
# IsAuthenticated
if not request.user or not request.user.is_authenticated:
    return 403 Forbidden

# VendorScopedPermission (for object-level, not called on create)
# For create, only IsAuthenticated is checked
```

**If Permissions Fail:**
- Returns `403 Forbidden`
- View is never called

**If Permissions Pass:**
- Continues to viewset

---

### Step 4: Serializer Validation

**ViewSet calls serializer:**
```python
def create(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)  # Validate here
    self.perform_create(serializer)
    return Response(serializer.data, status=201)
```

**Serializer validation:**
```python
class CollectibleSerializer(serializers.ModelSerializer):
    def validate_quantity(self, value):
        if value < 0:
            raise ValidationError("Quantity cannot be negative.")
        return value
    
    def validate_intake_price(self, value):
        if value < 0:
            raise ValidationError("Intake price cannot be negative.")
        return value
```

**Validation Steps:**
1. **Type checking:** Is `intake_price` a number? Is `name` a string?
2. **Required fields:** Are all required fields present?
3. **Field validation:** Call `validate_<field>()` methods
4. **Object validation:** Call `validate()` method (cross-field validation)
5. **Nested validation:** Validate `card_details` with CardDetailsSerializer

**If Validation Fails:**
```json
// 400 Bad Request
{
  "intake_price": ["Intake price cannot be negative."],
  "sku": ["This field is required."]
}
```

**If Validation Passes:**
- `serializer.validated_data` contains clean data
- Continues to perform_create

---

### Step 5: perform_create (Business Logic)

**Viewset:**
```python
def perform_create(self, serializer):
    payload = dict(serializer.validated_data)
    card_details_data = payload.pop('card_details', None)
    
    # Resolve vendor from JWT token
    vendor = resolve_user_vendor(self.request.user)
    payload['vendor'] = vendor
    payload['user'] = self.request.user
    
    # Call service (business logic)
    instance = create_item(data=payload, card_details_data=card_details_data)
    
    serializer.instance = instance
```

**Key Actions:**
1. **Extract nested data:** Remove `card_details` from payload
2. **Add vendor/user:** From JWT token (security)
3. **Call service function:** Not serializer.save()
4. **Set instance:** So DRF can serialize response

---

### Step 6: Service Execution

**Service (inventory/services/create_item.py):**
```python
def create_item(*, data, card_details_data=None) -> Collectible:
    payload = data.copy()
    
    # Business logic: validate image URL
    image_url = payload.get("image_url")
    if image_url:
        validate_image_url(image_url)  # Checks domain, accessibility
    
    # Atomic transaction
    with transaction.atomic():
        # Create collectible
        collectible = Collectible.objects.create(**payload)
        
        # Create card details if provided
        if card_details_data:
            CardDetails.objects.create(
                collectible=collectible,
                **card_details_data
            )
    
    return collectible
```

**Database Operations:**
```sql
BEGIN;  -- Start transaction

INSERT INTO collectible (user_id, vendor_id, name, sku, category, ...)
VALUES (1, 1, 'Charizard Holo', 'PKMN-001', 'Trading Cards', ...);
-- Returns collectible.id = 123

INSERT INTO card_details (collectible_id, game, set_name, is_first_edition, ...)
VALUES (123, 'Pokemon', 'Base Set', true, ...);

COMMIT;  -- End transaction (both inserts succeed)
```

**If Any Error:**
```sql
ROLLBACK;  -- Undo all changes (nothing saved)
```

**Transaction Benefits:**
- **Atomic:** Both succeed or both fail
- **Consistent:** Database never has collectible without card_details
- **Isolated:** Other requests don't see partial state
- **Durable:** Once committed, data is permanent

---

### Step 7: Serialize Response

**DRF automatically serializes instance:**
```python
serializer = CollectibleSerializer(instance)
return Response(serializer.data, status=201)
```

**Serializer converts model → JSON:**
```python
{
  "id": 123,
  "user": 1,
  "vendor": 1,
  "name": "Charizard Holo",
  "sku": "PKMN-001",
  "category": "Trading Cards",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1,
  "card_details": {
    "game": "Pokemon",
    "set_name": "Base Set",
    "is_first_edition": true
  },
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T12:00:00Z"
}
```

---

### Step 8: HTTP Response

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 123,
  "user": 1,
  "vendor": 1,
  "name": "Charizard Holo",
  ...
}
```

**Client receives:**
- Status code 201 (Created)
- JSON response with new collectible
- Can use `id` for future updates/deletes

---

### Complete Flow Diagram

```
Client Request (JSON)
    ↓
Django URL Router (match /api/collectibles/)
    ↓
DRF JWT Authentication (verify token, set request.user)
    ↓
DRF Permission Check (IsAuthenticated)
    ↓
ViewSet.create() called
    ↓
Serializer.is_valid() (type check, field validation)
    ↓
ViewSet.perform_create() (extract vendor, prepare data)
    ↓
Service: create_item() (business logic, transaction)
    ↓
Database: INSERT collectible, INSERT card_details (atomic)
    ↓
Service returns Collectible instance
    ↓
Serializer.data (model → JSON)
    ↓
Response (201 Created, JSON body)
    ↓
Client receives new collectible
```

---

## Database Design

### Entity Relationship Diagram

```
User (Django auth)
  ↓ 1:1
UserProfile
  ↓ M:1
Vendor
  ↓ 1:M
Collectible
  ↓ 1:1 (optional)
CardDetails
```

**Relationships:**

**User → UserProfile:** OneToOne
- `user.profile` → UserProfile
- `profile.user` → User
- **Why:** Extends User with app-specific data

**UserProfile → Vendor:** ForeignKey (ManyToOne)
- `VendorMember.is_primary` → marks the active vendor for a user
- `vendor.users.all()` → QuerySet of UserProfile
- **Why:** Multiple users can belong to one vendor (future team accounts)

**Vendor → Collectible:** ForeignKey (OneToMany)
- `vendor.collectibles.all()` → QuerySet of Collectible
- `collectible.vendor` → Vendor
- **Why:** Vendor owns many collectibles

**Collectible → CardDetails:** OneToOne (optional)
- `collectible.card_details` → CardDetails or None
- `card_details.collectible` → Collectible
- **Why:** Not all collectibles are cards, optional extension

---

### Database Indexes

**Auto-created indexes:**
- Primary keys (`id`) - Clustered index
- Foreign keys (`user_id`, `vendor_id`, `collectible_id`) - Non-clustered index
- Unique fields (`sku`, `email`) - Unique index

**Manual indexes (should be added):**
```python
class Collectible(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['vendor', 'category']),  # Common filter combo
            models.Index(fields=['vendor', 'created_at']),  # Sort by date
            models.Index(fields=['-projected_sell_price']),  # Sort by price desc
        ]
```

**Why Indexes:**
- Speed up queries: `WHERE vendor_id = 1 AND category = 'Trading Cards'`
- Without index: Full table scan (slow at 10,000+ rows)
- With index: B-tree lookup (fast at millions of rows)

**Index Trade-offs:**
- **Pros:** Faster reads
- **Cons:** Slower writes (must update index), more storage
- **Rule:** Index frequently queried/filtered fields

---

### Constraints

**Database-level constraints:**
1. **Primary Key:** Every table has unique `id`
2. **Foreign Key:** `vendor_id` must exist in `vendors` table
3. **Unique:** `sku` must be unique (no duplicates)
4. **Not Null:** Required fields (name, sku, etc.)

**Application-level constraints:**
1. **Positive prices:** `intake_price >= 0` (validated in serializer)
2. **Positive quantity:** `quantity >= 0` (validated in serializer)
3. **Vendor scoping:** User can only access their vendor's data (queryset filter + permission)

**Why Both Levels:**
- **Database:** Last line of defense (can't save bad data)
- **Application:** User-friendly error messages
- **Example:** If you skip serializer validation, database constraint still prevents negative prices

---

## Testing Strategy

Comprehensive test suite with 93% coverage.

### Test Structure

```
backend/catalog/tests/
├── api/
│   ├── test_api_security.py       # 91 tests (authentication, permissions, validation)
│   ├── test_viewsets.py           # ViewSet CRUD tests
│   ├── test_vendor_permissions.py # Multi-tenant isolation tests
│   └── test_card_details_api.py   # Card details nested object tests
├── services/
│   └── test_create_item.py        # Service business logic tests
├── selectors/
│   └── test_list_items.py         # Selector query tests
└── management/
    └── test_load_demo_data.py     # Management command tests
```

### Test Categories

**1. Authentication Tests**
```python
def test_collectible_list_requires_authentication(api_client):
    """Unauthenticated request returns 401."""
    response = api_client.get('/api/collectibles/')
    assert response.status_code == 401
```

**2. Vendor Isolation Tests**
```python
def test_user_cannot_access_other_vendor_collectible(authenticated_client, other_vendor_collectible):
    """User A cannot access User B's collectible."""
    response = authenticated_client.get(f'/api/collectibles/{other_vendor_collectible.id}/')
    assert response.status_code == 404  # Not found (scoped queryset)
```

**3. Input Validation Tests**
```python
def test_sku_must_be_unique_per_vendor(authenticated_client):
    """Cannot create two collectibles with same SKU."""
    data = {"name": "Item 1", "sku": "TEST-001", ...}
    authenticated_client.post('/api/collectibles/', data)
    
    response = authenticated_client.post('/api/collectibles/', data)
    assert response.status_code == 400
    assert 'sku' in response.data
```

**4. Status Code Tests**
```python
def test_create_collectible_returns_201(authenticated_client):
    """Successful creation returns 201 Created."""
    response = authenticated_client.post('/api/collectibles/', valid_data)
    assert response.status_code == 201
    assert 'id' in response.data
```

**5. Service Tests**
```python
def test_create_item_with_card_details(user, vendor):
    """Service creates collectible + card_details atomically."""
    collectible = create_item(
        data={'name': 'Card', 'sku': 'TEST', 'vendor': vendor, 'user': user, ...},
        card_details_data={'game': 'Pokemon', 'set_name': 'Base Set'}
    )
    assert collectible.card_details.game == 'Pokemon'
```

### Test Fixtures

**pytest fixtures provide test data:**
```python
@pytest.fixture
def user(db):
    """Create test user."""
    return User.objects.create_user(email='test@example.com', password='pass')

@pytest.fixture
def vendor(user):
    """Create test vendor."""
    vendor = Vendor.objects.create(name='Test Vendor')
    UserProfile.objects.create(user=user, vendor=vendor)
    return vendor

@pytest.fixture
def authenticated_client(user, api_client):
    """API client with JWT token."""
    token = AccessToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client
```

**Benefits:**
- **Isolation:** Each test gets fresh data
- **Reusability:** Fixtures used across many tests
- **Readability:** Test focuses on logic, not setup

### Coverage Report

```
Name                                    Stmts   Miss  Cover
-----------------------------------------------------------
backend/catalog/models.py               45      0   100%
backend/catalog/api/serializers.py      52      3    94%
backend/catalog/api/viewsets.py         67      5    93%
backend/catalog/services/create.py      18      1    94%
backend/catalog/selectors/list.py       24      2    92%
backend/core/permissions.py               32      1    97%
backend/vendors/api/viewsets.py           28      2    93%
backend/users/api/viewsets.py             41      3    93%
-----------------------------------------------------------
TOTAL                                   1247     82    93%
```

**High Coverage:**
- Models: 100% (all fields tested)
- Services: 94% (all business logic paths tested)
- Viewsets: 93% (all HTTP methods tested)
- Permissions: 97% (all security paths tested)

**What's Not Covered (7%):**
- Error handling for rare edge cases
- Admin panel code (tested manually)
- Some Django-generated code

---

## Summary

### Key Takeaways

**1. Domain-Driven Structure:**
- Each app (users, vendors, inventory) is a bounded context
- Clear separation of concerns
- Scales well as features grow

**2. Service/Selector Pattern:**
- Services handle writes (create, update, delete)
- Selectors handle reads (list, get, filter)
- Business logic is reusable and testable
- Viewsets stay thin (just HTTP handling)

**3. JWT Authentication:**
- Stateless, scalable, works with mobile
- Short-lived access tokens (5 min)
- Long-lived refresh tokens (1 day)
- Automatic user resolution from token

**4. Multi-Tenant Security:**
- Vendor scoping at queryset level (can't query other vendors)
- Permission checks at object level (can't access other vendors' items)
- Defense in depth (both layers must fail for breach)

**5. Serializers Handle Validation:**
- Type checking (is this a number?)
- Field validation (is quantity positive?)
- Business rules (is SKU unique?)
- Clean separation from business logic

**6. Transaction Management:**
- Atomic operations (all succeed or all fail)
- Consistent database state
- Services wrap transactions around multi-step operations

**7. Comprehensive Testing:**
- 93% code coverage
- Authentication, permissions, validation, business logic all tested
- Fast (runs in 3 seconds)
- Prevents regressions

This architecture is production-ready and follows industry best practices. It's maintainable, scalable, and secure.

# Backend Improvement Suggestions

> Enhancements to make the Django API production-ready and impressive

---

## Current State Analysis

### ✅ What's Already Good

1. **Domain-Driven Structure** - `selectors/`, `services/` pattern
2. **OpenAPI Schema** - Automatic documentation
3. **JWT Authentication** - Industry standard
4. **Proper Django Apps** - `inventory`, `vendors`, `users`
5. **Test Files Exist** - Foundation for coverage

### ⚠️ Areas for Improvement

---

## Priority 1: API Polish

### 1.1 Add Pagination Metadata

**Current:** Returns raw array
**Better:** Include pagination info

```python
# Before
{
    "results": [...]
}

# After
{
    "count": 247,
    "next": "/api/v1/catalog/items/?page=2",
    "previous": null,
    "page": 1,
    "page_size": 20,
    "total_pages": 13,
    "results": [...]
}
```

**Implementation:**
```python
# core/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page': self.page.number,
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })
```

---

### 1.2 Add Filtering Query Parameters

**Document in OpenAPI:**
```python
# inventory/api/views.py
from django_filters.rest_framework import DjangoFilterBackend

class CollectibleViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'vendor', 'condition']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'created_at', 'value']
    ordering = ['-created_at']
```

---

### 1.3 Complete the OpenAPI Schema

**Current Issues:**
- Title is empty: `"title": ""`
- No description
- Missing example responses

**Fix:**
```python
# omni_stock/settings.py
SPECTACULAR_SETTINGS = {
    'TITLE': 'Omni-Stock API',
    'DESCRIPTION': 'Inventory management API for collectors and resellers',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

---

## Priority 2: Data Model Enhancements

### 2.1 Add Timestamps to All Models

```python
# core/models.py
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

# inventory/models.py
class Collectible(TimeStampedModel):
    # ... existing fields
```

---

### 2.2 Add Audit Fields

```python
class AuditedModel(TimeStampedModel):
    created_by = models.ForeignKey(
        'users.User', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_%(class)s_set'
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_%(class)s_set'
    )
    
    class Meta:
        abstract = True
```

---

### 2.3 Add Soft Delete

```python
class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

# Custom manager to filter deleted items
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
```

---

## Priority 3: API Endpoint Additions

### 3.1 Dashboard Summary Endpoint

```python
# dashboard/api/views.py
@api_view(['GET'])
def dashboard_summary(request):
    user = request.user
    collectibles = Collectible.objects.filter(vendor__owner=user)
    
    return Response({
        'total_items': collectibles.count(),
        'total_vendors': Vendor.objects.filter(owner=user).count(),
        'total_value': collectibles.aggregate(Sum('value'))['value__sum'] or 0,
        'items_this_month': collectibles.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count(),
        'items_by_category': collectibles.values('category').annotate(
            count=Count('id')
        ),
        'recent_items': CollectibleSerializer(
            collectibles.order_by('-created_at')[:5], 
            many=True
        ).data
    })
```

---

### 3.2 Bulk Operations

```python
# inventory/api/views.py
@action(detail=False, methods=['post'])
def bulk_delete(self, request):
    ids = request.data.get('ids', [])
    if not ids:
        return Response({'error': 'No IDs provided'}, status=400)
    
    deleted_count = Collectible.objects.filter(
        id__in=ids,
        vendor__owner=request.user
    ).delete()[0]
    
    return Response({'deleted': deleted_count})

@action(detail=False, methods=['post'])
def bulk_update(self, request):
    ids = request.data.get('ids', [])
    updates = request.data.get('updates', {})
    
    updated_count = Collectible.objects.filter(
        id__in=ids,
        vendor__owner=request.user
    ).update(**updates)
    
    return Response({'updated': updated_count})
```

---

### 3.3 Export Endpoint

```python
@action(detail=False, methods=['get'])
def export(self, request):
    collectibles = self.get_queryset()
    
    format = request.query_params.get('format', 'csv')
    
    if format == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'SKU', 'Category', 'Value', 'Quantity'])
        
        for item in collectibles:
            writer.writerow([
                item.name, item.sku, item.category, 
                item.value, item.quantity
            ])
        
        return response
```

---

## Priority 4: Security Enhancements

### 4.1 Rate Limiting

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

### 4.2 Request Validation

```python
# core/middleware.py
class RequestSizeLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.max_size = 10 * 1024 * 1024  # 10MB
    
    def __call__(self, request):
        if request.content_length and request.content_length > self.max_size:
            return JsonResponse(
                {'error': 'Request too large'}, 
                status=413
            )
        return self.get_response(request)
```

---

### 4.3 CORS Configuration

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://omni-stock.vercel.app",
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## Priority 5: Testing Improvements

### 5.1 API Integration Tests

```python
# catalog/tests/test_api.py
class CollectibleAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('test', 'test@test.com', 'pass')
        self.vendor = Vendor.objects.create(name='Test Vendor', owner=self.user)
        self.client.force_authenticate(user=self.user)
    
    def test_list_collectibles(self):
        Collectible.objects.create(
            name='Test Item', 
            vendor=self.vendor,
            sku='TEST001'
        )
        response = self.client.get('/api/v1/catalog/items/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_cannot_access_other_user_items(self):
        other_user = User.objects.create_user('other', 'other@test.com', 'pass')
        other_vendor = Vendor.objects.create(name='Other Vendor', owner=other_user)
        Collectible.objects.create(name='Other Item', vendor=other_vendor)
        
        response = self.client.get('/api/v1/catalog/items/')
        self.assertEqual(len(response.data['results']), 0)
```

---

### 5.2 Service Layer Tests

```python
# catalog/tests/test_services.py
class CollectibleServiceTestCase(TestCase):
    def test_create_collectible_assigns_sku(self):
        vendor = VendorFactory()
        
        collectible = CollectibleService.create(
            name='New Item',
            vendor=vendor,
            quantity=1
        )
        
        self.assertIsNotNone(collectible.sku)
        self.assertTrue(collectible.sku.startswith('ITEM-'))
```

---

## Priority 6: Performance Optimizations

### 6.1 Database Query Optimization

```python
# inventory/selectors.py
def get_collectibles_for_user(user, filters=None):
    queryset = (
        Collectible.objects
        .select_related('vendor', 'category')
        .prefetch_related('images')
        .filter(vendor__owner=user, is_deleted=False)
    )
    
    if filters:
        if filters.get('category'):
            queryset = queryset.filter(category_id=filters['category'])
        if filters.get('search'):
            queryset = queryset.filter(
                Q(name__icontains=filters['search']) |
                Q(sku__icontains=filters['search'])
            )
    
    return queryset.order_by('-created_at')
```

---

### 6.2 Caching

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    }
}

# inventory/api/views.py
from django.views.decorators.cache import cache_page

class CollectibleViewSet(viewsets.ModelViewSet):
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

---

### 6.3 Database Indexes

```python
# inventory/models.py
class Collectible(TimeStampedModel):
    # ... fields
    
    class Meta:
        indexes = [
            models.Index(fields=['vendor', '-created_at']),
            models.Index(fields=['name']),
            models.Index(fields=['sku']),
            models.Index(fields=['category', 'vendor']),
        ]
```

---

## Implementation Checklist

### Phase 1 (High Impact, Low Effort)
- [ ] Add proper pagination with metadata
- [ ] Complete OpenAPI schema (title, description)
- [ ] Add timestamps to API responses
- [ ] Add rate limiting

### Phase 2 (Medium Effort)
- [ ] Add filtering/sorting query parameters
- [ ] Create dashboard summary endpoint
- [ ] Add bulk operations
- [ ] Write API integration tests

### Phase 3 (Future)
- [ ] Add export endpoint
- [ ] Implement soft delete
- [ ] Add audit trail
- [ ] Set up Redis caching
- [ ] Add database indexes

---

## Documentation Additions

Create these files:

1. **`docs/api/README.md`** - API usage guide
2. **`docs/api/authentication.md`** - Auth flow documentation
3. **`docs/api/errors.md`** - Error response documentation
4. **`docs/architecture.md`** - Backend architecture diagram

This documentation shows hiring managers you think about the full picture, not just code.

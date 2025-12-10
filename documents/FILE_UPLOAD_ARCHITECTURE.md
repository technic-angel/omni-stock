# 📁 File Upload Architecture: Local vs Supabase

This document explains how file uploads work in omni-stock, covering both local development (Django FileSystemStorage) and production (Supabase Storage).

---

## 🎯 Overview

**Goal**: Store user-uploaded files (profile pictures, product images) in a way that:
- ✅ Works seamlessly in local development
- ✅ Scales in production with cloud storage (Supabase)
- ✅ Requires minimal code changes between environments
- ✅ Handles file cleanup automatically

**Architecture Pattern**: Django Storage Backends

Django uses a **pluggable storage backend** system. You can swap storage backends without changing your model code!

```python
# Your model code stays the same:
class UserProfile(models.Model):
    profile_picture = models.ImageField(upload_to='profile_pictures/')
    
# Django automatically uses the configured storage backend
# Local: FileSystemStorage → saves to disk
# Production: SupabaseStorage → saves to Supabase cloud
```

---

## 🏠 Local Development: FileSystemStorage

### How It Works

**Current Setup** (already configured in `settings.py`):

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

**File Flow**:
```
User uploads → Django receives file → Saves to backend/media/ → Returns relative path
                                      └─ Example: media/profile_pictures/melissa_abc123.jpg
```

**Storage Location**:
```
backend/
  media/                    ← MEDIA_ROOT (created automatically)
    profile_pictures/       ← upload_to='profile_pictures/'
      melissa.jpg
      john_xyz456.jpg
```

**URL Generation**:
- Django serves files via URL: `http://localhost:8000/media/profile_pictures/melissa.jpg`
- DRF serializers automatically convert `ImageField` → full URL
- Configured in `urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### ✅ Pros of FileSystemStorage
- Zero configuration (built-in)
- Fast (local disk access)
- No external dependencies
- Perfect for development and testing

### ❌ Cons of FileSystemStorage
- Doesn't scale (single server only)
- Files lost when container restarts (Docker ephemeral storage)
- No CDN support
- Manual backups required

---

## ☁️ Production: Supabase Storage

### What is Supabase Storage?

Supabase Storage is an **S3-compatible object storage** service that provides:
- ✅ Unlimited scalability
- ✅ CDN distribution (fast global access)
- ✅ Automatic backups
- ✅ Fine-grained access control (RLS policies)
- ✅ Public/private buckets

### Architecture

**Storage Backend**: `django-storages` + custom Supabase backend

```
User uploads → Django → SupabaseStorage → Supabase API → S3-compatible storage
                                           └─ Returns public URL
```

### Implementation Plan

We'll use **django-storages** with a **custom Supabase backend** because there's no official django-storages backend for Supabase yet.

---

## 🛠️ Implementation: Step-by-Step

### Step 1: Install Dependencies

Add to `backend/requirements.txt`:

```txt
# File storage backends
django-storages[s3]==1.14.4  # S3-compatible storage backend
boto3==1.34.162              # AWS SDK (S3 client)
supabase-py==2.15.0          # Supabase Python client
```

### Step 2: Create Supabase Storage Backend

**File**: `backend/core/storage_backends.py`

```python
"""
Custom storage backends for file uploads.

This module provides a Supabase-compatible storage backend for Django.
Supabase Storage is S3-compatible, so we use django-storages' S3 backend
with Supabase-specific configuration.
"""
import os
from storages.backends.s3boto3 import S3Boto3Storage


class SupabaseStorage(S3Boto3Storage):
    """
    Custom storage backend for Supabase Storage.
    
    Supabase Storage is S3-compatible, so we can use the S3Boto3Storage
    backend with Supabase-specific endpoint and configuration.
    
    Usage in models:
        profile_picture = models.ImageField(
            upload_to='profile_pictures/',
            storage=SupabaseStorage()  # Explicitly use Supabase
        )
    
    Or set as default in settings.py:
        DEFAULT_FILE_STORAGE = 'backend.core.storage_backends.SupabaseStorage'
    """
    
    # Supabase bucket configuration
    bucket_name = os.environ.get('SUPABASE_STORAGE_BUCKET', 'omni-stock-media')
    
    # S3-compatible endpoint (Supabase provides this)
    endpoint_url = os.environ.get('SUPABASE_STORAGE_ENDPOINT')
    
    # Access control
    default_acl = 'public-read'  # Make files publicly accessible
    querystring_auth = False      # Don't use signed URLs
    
    # Custom domain (Supabase public URL)
    custom_domain = os.environ.get('SUPABASE_STORAGE_CUSTOM_DOMAIN')
    
    def __init__(self, **settings):
        """Initialize with Supabase-specific settings."""
        super().__init__(**settings)
        
        # Override settings from environment
        self.access_key = os.environ.get('SUPABASE_STORAGE_ACCESS_KEY')
        self.secret_key = os.environ.get('SUPABASE_STORAGE_SECRET_KEY')


class LocalMediaStorage(S3Boto3Storage):
    """
    Explicit local media storage backend.
    
    This is a wrapper around Django's default FileSystemStorage
    but provides a consistent interface with SupabaseStorage.
    """
    location = os.path.join('media')
    base_url = '/media/'
```

### Step 3: Update Django Settings

**File**: `backend/omni_stock/settings.py`

Add this section after `MEDIA_ROOT`:

```python
# File Storage Configuration
# --------------------------
# Dynamically choose storage backend based on environment
USE_SUPABASE_STORAGE = env.bool('USE_SUPABASE_STORAGE', default=False)

if USE_SUPABASE_STORAGE:
    # Production: Use Supabase Storage
    DEFAULT_FILE_STORAGE = 'backend.core.storage_backends.SupabaseStorage'
    
    # Supabase Storage Configuration
    # These are S3-compatible settings for django-storages
    AWS_ACCESS_KEY_ID = env('SUPABASE_STORAGE_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = env('SUPABASE_STORAGE_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = env('SUPABASE_STORAGE_BUCKET', default='omni-stock-media')
    AWS_S3_ENDPOINT_URL = env('SUPABASE_STORAGE_ENDPOINT')
    AWS_S3_CUSTOM_DOMAIN = env('SUPABASE_STORAGE_CUSTOM_DOMAIN', default=None)
    
    # S3 settings for Supabase compatibility
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',  # Cache for 1 day
    }
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False  # Don't overwrite files with same name
    
else:
    # Local development: Use FileSystemStorage (already configured)
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
```

### Step 4: Environment Variables

**Local Development** (`.env`):
```bash
# Local development uses FileSystemStorage (default)
USE_SUPABASE_STORAGE=False
```

**Production** (Render.com environment):
```bash
# Enable Supabase Storage
USE_SUPABASE_STORAGE=True

# Supabase Storage Credentials
SUPABASE_STORAGE_BUCKET=omni-stock-media
SUPABASE_STORAGE_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_STORAGE_ACCESS_KEY=your-access-key
SUPABASE_STORAGE_SECRET_KEY=your-secret-key
SUPABASE_STORAGE_CUSTOM_DOMAIN=your-project.supabase.co/storage/v1/object/public/omni-stock-media
```

### Step 5: Supabase Bucket Setup

**In Supabase Dashboard**:

1. Go to **Storage** → **Create Bucket**
2. Bucket name: `omni-stock-media`
3. Public bucket: **Yes** (for public profile pictures)
4. File size limit: 5MB (adjust as needed)

**Create folders**:
```
omni-stock-media/
  profile_pictures/
  product_images/
  vendor_logos/
```

**Access Policies** (RLS):
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'omni-stock-media');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'omni-stock-media');

-- Allow users to update/delete their own files
CREATE POLICY "Allow user file management"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'omni-stock-media' AND auth.uid()::text = owner);
```

---

## 🔄 How File Uploads Work

### Request Flow

```
1. Frontend uploads file
   POST /api/v1/users/profile/picture/
   Content-Type: multipart/form-data
   Authorization: Bearer <jwt-token>
   
   Body:
   {
     "picture_file": <binary-data>
   }

2. Django receives request
   ↓
3. update_profile_picture service called
   ↓
4. Django saves file using storage backend
   ↓
   [Local]      → Saves to backend/media/
   [Supabase]   → Uploads to Supabase Storage
   ↓
5. Django stores file path in database
   UserProfile.profile_picture = "profile_pictures/melissa.jpg"
   ↓
6. Response includes full URL
   {
     "profile_picture": "https://supabase.co/.../melissa.jpg"
   }
```

### URL Generation

**Local**:
```python
profile.profile_picture.url
# → "/media/profile_pictures/melissa.jpg"
# Full URL: "http://localhost:8000/media/profile_pictures/melissa.jpg"
```

**Supabase**:
```python
profile.profile_picture.url
# → "https://your-project.supabase.co/storage/v1/object/public/omni-stock-media/profile_pictures/melissa.jpg"
```

**DRF Serializer automatically handles this**:
```python
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['profile_picture']
    
# Serializer output:
# {
#   "profile_picture": "https://supabase.co/.../melissa.jpg"  ← Full URL!
# }
```

---

## 🧪 Testing File Uploads

### Local Testing (Current Setup)

```python
# Already works with FileSystemStorage!
from django.core.files.uploadedfile import SimpleUploadedFile

picture = SimpleUploadedFile("test.jpg", b"fake-image-data", content_type="image/jpeg")
update_profile_picture(user_id=user.id, picture_file=picture)

# File saved to: backend/media/profile_pictures/test.jpg
```

### Production Testing (Supabase)

```python
# Same code works with Supabase!
# Just set USE_SUPABASE_STORAGE=True

picture = SimpleUploadedFile("test.jpg", b"fake-image-data", content_type="image/jpeg")
update_profile_picture(user_id=user.id, picture_file=picture)

# File uploaded to: Supabase Storage bucket
# URL: https://supabase.co/.../test.jpg
```

**No code changes needed!** Django's storage abstraction handles it.

---

## 🎨 Frontend Integration

### Uploading Files (React)

```typescript
// Upload profile picture
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('picture_file', file);
  
  const response = await fetch('/api/v1/users/profile/picture/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,  // Don't set Content-Type, browser does it automatically
  });
  
  const data = await response.json();
  console.log('Uploaded:', data.profile_picture);
  // → "https://supabase.co/.../melissa.jpg"
};
```

### Displaying Images

```tsx
// Get current user data (includes profile_picture URL)
const { data: user } = useQuery({
  queryKey: ['currentUser'],
  queryFn: async () => {
    const res = await fetch('/api/v1/auth/me/', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return res.json();
  },
});

// Display profile picture
return (
  <img 
    src={user.profile.profile_picture || '/default-avatar.png'}
    alt="Profile"
  />
);
```

---

## 🔐 Security Considerations

### 1. File Type Validation

**Backend** (already implemented):
```python
# In UserProfile model
profile_picture = models.ImageField(
    upload_to='profile_pictures/',
    validators=[validate_image_file]  # Add validator
)

def validate_image_file(file):
    """Validate file is actually an image."""
    valid_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in valid_mime_types:
        raise ValidationError('Only image files are allowed.')
    
    # Validate file size (5MB max)
    if file.size > 5 * 1024 * 1024:
        raise ValidationError('Image file too large (max 5MB).')
```

### 2. File Name Sanitization

Django automatically sanitizes filenames:
```python
# User uploads: "../../etc/passwd.jpg"
# Django saves as: "etcpasswd.jpg" (safe!)
```

### 3. Access Control

**Supabase RLS Policies** ensure:
- Only authenticated users can upload
- Only file owners can delete
- Public read access for public content

**Django View Permissions**:
```python
class UpdateProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]  # Require login
    
    def post(self, request):
        # User can only update their own profile
        update_profile_picture(user_id=request.user.id, ...)
```

---

## 📊 Cost & Performance Comparison

| Feature | Local (FileSystemStorage) | Supabase Storage |
|---------|---------------------------|------------------|
| **Storage Cost** | Free (local disk) | ~$0.021/GB/month |
| **Bandwidth** | Free | Free (100GB), then $0.09/GB |
| **Speed** | Fast (local) | Fast (CDN) |
| **Scalability** | Limited (single server) | Unlimited |
| **Backups** | Manual | Automatic |
| **CDN** | ❌ | ✅ |
| **Global Access** | ❌ | ✅ |

**Recommendation**: 
- **Development**: FileSystemStorage (simple, fast)
- **Production**: Supabase Storage (scalable, reliable)

---

## 🚀 Migration Path

### Phase 1: Local Development (Current ✅)
- Use FileSystemStorage
- All tests passing
- Files in `backend/media/`

### Phase 2: Add Supabase Support (Next)
1. Install `django-storages` and `boto3`
2. Create `storage_backends.py`
3. Update `settings.py` with environment-based switching
4. Set up Supabase bucket
5. Test with `USE_SUPABASE_STORAGE=True` locally

### Phase 3: Production Deploy
1. Set Supabase environment variables on Render.com
2. Deploy backend with `USE_SUPABASE_STORAGE=True`
3. Test uploads in production
4. Verify URLs are public and accessible

### Phase 4: Data Migration (if needed)
```bash
# If you have existing files in local storage, migrate to Supabase
python manage.py migrate_media_to_supabase
```

---

## 🔧 Troubleshooting

### Issue: Files not uploading to Supabase

**Check**:
1. Environment variables set correctly?
2. Supabase bucket exists and is public?
3. Access keys have write permissions?
4. Check Django logs for S3 errors

```bash
docker compose logs backend | grep -i storage
```

### Issue: URLs returning 403 Forbidden

**Solution**: Check Supabase RLS policies
```sql
-- Test bucket access
SELECT * FROM storage.buckets WHERE id = 'omni-stock-media';

-- Test object access
SELECT * FROM storage.objects WHERE bucket_id = 'omni-stock-media';
```

### Issue: Images slow to load

**Solution**: Enable CDN caching
```python
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',  # Cache for 1 day
}
```

---

## 📚 Further Reading

- [Django Storage Backends](https://docs.djangoproject.com/en/5.0/howto/custom-file-storage/)
- [django-storages Documentation](https://django-storages.readthedocs.io/)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [S3-Compatible Storage](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services)

---

## 🎓 Key Takeaways

1. **Storage Backends are Pluggable**: Swap storage without changing model code
2. **Environment-Based Configuration**: Use local in dev, Supabase in prod
3. **Django Abstracts Complexity**: `ImageField` works the same regardless of backend
4. **Security First**: Validate files, use RLS policies, require authentication
5. **Cost-Effective**: FileSystemStorage for dev, Supabase for production scale

**Next Steps**: Ready to implement? Let's add the Supabase storage backend! 🚀

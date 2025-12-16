# 🔧 Supabase Storage Setup Guide

This guide walks you through setting up Supabase Storage for testing profile picture uploads.

---

## 📋 Prerequisites

- Supabase account (free tier works!)
- Supabase project created
- Backend running locally

---

## Step 1: Create Supabase Storage Bucket

### Via Supabase Dashboard

1. **Go to your Supabase project**
   - URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Storage**
   - Left sidebar → Click "Storage"

3. **Create New Bucket**
   - Click "New bucket" button
   - **Bucket name**: `omni-stock-media`
   - **Public bucket**: ✅ YES (check this box)
   - **File size limit**: 5 MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty (or add: image/jpeg, image/png, image/gif, image/webp)
   - Click "Create bucket"

4. **Create Folders** (optional, but recommended)
   - Inside `omni-stock-media` bucket, create folders:
     - `profile_pictures/`
     - `product_images/`
     - `vendor_logos/`

---

## Step 2: Configure Storage Policies (RLS)

Supabase uses Row Level Security (RLS) for access control. We need to set up policies.

### Via Supabase SQL Editor

1. **Go to SQL Editor**
   - Left sidebar → "SQL Editor"
   - Click "New query"

2. **Run This SQL** (copy and paste):

```sql
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'omni-stock-media');

-- Policy 2: Allow public reads (so images are accessible)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'omni-stock-media');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'omni-stock-media');

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'omni-stock-media');
```

3. **Click "Run"** to execute

---

## Step 3: Get Supabase Storage Credentials

### Option A: Using Project API Keys (Easiest for Testing)

1. **Go to Project Settings**
   - Left sidebar → Click gear icon ⚙️ → "Settings"
   - Click "API" in settings menu

2. **Copy These Values**:
   - **Project URL**: `https://abcdefghijklmnop.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (different long JWT token) ⚠️ SECRET!

### Option B: Using S3 Access Keys (Recommended for Production)

1. **Go to Project Settings → API**
   
2. **Scroll to "S3 Connection"** section

3. **Copy These Values**:
   - **S3 Protocol**: Enabled
   - **Endpoint**: `https://YOUR_PROJECT_ID.supabase.co/storage/v1/s3`
   - **Access Key ID**: `YOUR_ACCESS_KEY` (looks like random string)
   - **Secret Access Key**: `YOUR_SECRET_KEY` (longer random string) ⚠️ SECRET!
   - **Region**: `us-east-1` (or your project region)

**Note**: If you don't see S3 connection settings, you may need to enable it in your project settings or use Option A.

---

## Step 4: Configure Environment Variables

### Update Your `.env` File

Add these lines to `/Users/melissa/omni-stock/.env`:

```bash
# File Storage Configuration
USE_SUPABASE_STORAGE=True

# Supabase Storage (S3-compatible)
SUPABASE_STORAGE_BUCKET=omni-stock-media
SUPABASE_STORAGE_ENDPOINT=https://YOUR_PROJECT_ID.supabase.co/storage/v1/s3
SUPABASE_STORAGE_ACCESS_KEY=YOUR_ACCESS_KEY_HERE
SUPABASE_STORAGE_SECRET_KEY=YOUR_SECRET_KEY_HERE
SUPABASE_STORAGE_CUSTOM_DOMAIN=YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/omni-stock-media
```

**Replace**:
- `YOUR_PROJECT_ID` → Your actual Supabase project ID (e.g., `abcdefghijklmnop`)
- `YOUR_ACCESS_KEY_HERE` → Your S3 access key from Step 3
- `YOUR_SECRET_KEY_HERE` → Your S3 secret key from Step 3

### Example (with fake values):

```bash
USE_SUPABASE_STORAGE=True
SUPABASE_STORAGE_BUCKET=omni-stock-media
SUPABASE_STORAGE_ENDPOINT=https://abcdefghijklmnop.supabase.co/storage/v1/s3
SUPABASE_STORAGE_ACCESS_KEY=abc123xyz789
SUPABASE_STORAGE_SECRET_KEY=verylongsecretkey123456789
SUPABASE_STORAGE_CUSTOM_DOMAIN=abcdefghijklmnop.supabase.co/storage/v1/object/public/omni-stock-media
```

---

## Step 5: Restart Backend Container

The backend needs to reload environment variables:

```bash
cd /Users/melissa/omni-stock
docker compose restart backend
```

Or rebuild if needed:

```bash
docker compose down
docker compose up -d
```

---

## Step 6: Test Supabase Storage

### Run the Integration Test

```bash
docker compose exec backend pytest users/tests/test_storage_backends.py::test_supabase_storage_integration -v -s
```

This test will:
1. Create a test user
2. Upload a profile picture to Supabase
3. Verify the URL is an HTTPS Supabase URL
4. Check that the file is accessible

### Expected Output (Success):

```
users/tests/test_storage_backends.py::test_supabase_storage_integration PASSED [100%]

1 passed in 2.34s
```

### If Test Fails:

Check the error message:
- **"SUPABASE_STORAGE_ENDPOINT must be set"** → Check environment variables
- **"NoCredentialsError"** → Access keys incorrect
- **"403 Forbidden"** → Check RLS policies
- **"404 Not Found"** → Bucket doesn't exist or wrong name

---

## Step 7: Manual Test via API

### Create a Test User

```bash
docker compose exec backend python manage.py shell
```

```python
from backend.users.services.create_user import create_user

user = create_user(
    username="testsupabase",
    email="test@supabase.com",
    password="testpass123"
)
print(f"User ID: {user.id}")
exit()
```

### Get JWT Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testsupabase", "password": "testpass123"}'
```

Copy the `access` token from response.

### Upload Profile Picture

```bash
# Create a test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test_image.jpg

# Upload it
curl -X POST http://localhost:8000/api/v1/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -F "profile_picture=@test_image.jpg"
```

**Expected Response**:
```json
{
  "id": 1,
  "username": "testsupabase",
  "email": "test@supabase.com",
  "profile": {
    "profile_picture": "https://abcdefghijklmnop.supabase.co/storage/v1/object/public/omni-stock-media/profile_pictures/test_image_abc123.jpg"
  }
}
```

### Verify in Supabase Dashboard

1. Go to Storage → `omni-stock-media` bucket
2. Check `profile_pictures/` folder
3. You should see your uploaded file!
4. Click on it to view/download

---

## 🎯 Troubleshooting

### Issue: "No module named 'storages'"

**Solution**: Dependencies not installed in container
```bash
docker compose exec backend pip install 'django-storages[s3]==1.14.4' boto3==1.34.162
# Or rebuild container:
docker compose down
docker compose build backend
docker compose up -d
```

### Issue: "SUPABASE_STORAGE_ENDPOINT must be set"

**Solution**: Environment variable not loaded
```bash
# Check if variable is set:
docker compose exec backend env | grep SUPABASE

# Restart backend:
docker compose restart backend
```

### Issue: "AccessDenied" or "InvalidAccessKeyId"

**Solution**: Credentials incorrect
- Double-check access key and secret key
- Make sure no extra spaces or quotes
- Try regenerating credentials in Supabase dashboard

### Issue: "403 Forbidden" on upload

**Solution**: RLS policies not configured
- Run the SQL policies from Step 2
- Make sure bucket is public
- Check authenticated user has permissions

### Issue: Files uploading but 404 when accessing URL

**Solution**: Bucket not public
- In Supabase Storage → Settings
- Make sure `omni-stock-media` bucket is marked as **Public**

### Issue: "SignatureDoesNotMatch"

**Solution**: Endpoint URL incorrect
- Should be: `https://PROJECT_ID.supabase.co/storage/v1/s3`
- NOT: `https://PROJECT_ID.supabase.co` (missing `/storage/v1/s3`)

---

## 🔐 Security Notes

### Environment Variables

⚠️ **NEVER commit real credentials to git!**

- `.env` is gitignored ✅
- Keep `dev.env.example` with placeholders only
- Use different credentials for production

### Supabase Keys

- **anon/public key**: Safe to expose (has limited permissions)
- **service_role key**: ⚠️ SECRET! Never expose to frontend
- **S3 access keys**: ⚠️ SECRET! Only use on backend

### RLS Policies

Current policies allow:
- ✅ Anyone to read files (public bucket)
- ✅ Authenticated users to upload
- ✅ Authenticated users to update/delete

For production, you might want stricter policies:
```sql
-- Only allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'omni-stock-media' 
  AND auth.uid()::text = owner
);
```

---

## 🎉 Success Checklist

- [ ] Supabase bucket created (`omni-stock-media`)
- [ ] Bucket is public
- [ ] RLS policies configured
- [ ] S3 credentials obtained
- [ ] Environment variables set in `.env`
- [ ] Backend restarted
- [ ] Integration test passes
- [ ] Manual API test works
- [ ] File visible in Supabase dashboard

Once all checked, you're ready to use Supabase Storage! 🚀

---

## 📊 Cost Estimate (Supabase Free Tier)

- **Storage**: 1 GB free
- **Bandwidth**: 2 GB free
- **After limits**: ~$0.021/GB storage, ~$0.09/GB bandwidth

For testing/development, you'll stay well within free tier limits.

---

## 🔄 Switching Back to Local Storage

To switch back to local FileSystemStorage:

```bash
# In .env:
USE_SUPABASE_STORAGE=False

# Restart:
docker compose restart backend
```

---

## 📚 Next Steps

Once Supabase Storage is working:
1. Test with real images
2. Test upload from frontend
3. Configure for production (Render.com)
4. Set up CDN caching
5. Monitor storage usage

Need help with any step? Let me know! 🚀

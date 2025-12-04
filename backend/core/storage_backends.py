"""
Custom storage backends for file uploads.

This module provides storage backend configuration for Django file uploads.
Supports both local FileSystemStorage (development) and Supabase Storage (production).

Architecture:
- Local: Files stored in backend/media/ directory
- Supabase: Files uploaded to Supabase Storage (S3-compatible)
- Configuration switched via USE_SUPABASE_STORAGE environment variable

Usage:
    # In models (optional - uses DEFAULT_FILE_STORAGE by default):
    profile_picture = models.ImageField(upload_to='profile_pictures/')

    # Django automatically uses the configured storage backend
    # No code changes needed between local and production!
"""

import os
from typing import Optional

# Import will fail if django-storages not installed
# This is intentional - only needed when USE_SUPABASE_STORAGE=True
try:
    from storages.backends.s3boto3 import S3Boto3Storage

    STORAGES_AVAILABLE = True
except ImportError:
    STORAGES_AVAILABLE = False
    S3Boto3Storage = object  # Dummy class to avoid NameError


class SupabaseStorage(S3Boto3Storage):
    """
    Custom storage backend for Supabase Storage.

    Supabase Storage is S3-compatible, so we use django-storages' S3Boto3Storage
    with Supabase-specific configuration.

    Configuration (via environment variables):
        SUPABASE_STORAGE_BUCKET: Bucket name (default: 'omni-stock-media')
        SUPABASE_STORAGE_ENDPOINT: S3-compatible endpoint URL
        SUPABASE_STORAGE_ACCESS_KEY: Access key ID
        SUPABASE_STORAGE_SECRET_KEY: Secret access key
        SUPABASE_STORAGE_CUSTOM_DOMAIN: Optional custom domain for URLs

    Example:
        # In settings.py:
        if USE_SUPABASE_STORAGE:
            DEFAULT_FILE_STORAGE = 'backend.core.storage_backends.SupabaseStorage'

    Features:
        - Public read access (profile pictures, product images)
        - CDN caching (1 day)
        - No file overwriting (unique filenames)
        - Automatic cleanup when models are deleted
    """

    def __init__(self, **settings):
        """
        Initialize Supabase storage backend.

        Reads configuration from environment variables and sets up
        S3-compatible storage client for Supabase.
        """
        if not STORAGES_AVAILABLE:
            raise ImportError(
                "django-storages is required for SupabaseStorage. "
                "Install with: pip install django-storages[s3] boto3"
            )

        # Supabase bucket configuration
        self.bucket_name = os.environ.get("SUPABASE_STORAGE_BUCKET", "omni-stock-media")

        # S3-compatible endpoint (Supabase provides this)
        self.endpoint_url = os.environ.get("SUPABASE_STORAGE_ENDPOINT")
        if not self.endpoint_url:
            raise ValueError(
                "SUPABASE_STORAGE_ENDPOINT must be set when using SupabaseStorage. "
                "Example: https://your-project.supabase.co/storage/v1/s3"
            )

        # Access credentials
        self.access_key = os.environ.get("SUPABASE_STORAGE_ACCESS_KEY")
        self.secret_key = os.environ.get("SUPABASE_STORAGE_SECRET_KEY")

        if not self.access_key or not self.secret_key:
            raise ValueError(
                "SUPABASE_STORAGE_ACCESS_KEY and SUPABASE_STORAGE_SECRET_KEY "
                "must be set when using SupabaseStorage"
            )

        # Region setting (Supabase uses us-east-1 by default)
        self.region_name = os.environ.get("SUPABASE_STORAGE_REGION", "us-east-1")

        # Access control settings
        self.default_acl = "public-read"  # Make files publicly accessible
        self.querystring_auth = False  # Don't use signed URLs
        self.file_overwrite = False  # Generate unique filenames

        # CDN/Caching configuration
        self.object_parameters = {
            "CacheControl": "max-age=86400",  # Cache for 1 day
        }

        # Custom domain (optional - for cleaner URLs)
        custom_domain = os.environ.get("SUPABASE_STORAGE_CUSTOM_DOMAIN")
        if custom_domain:
            self.custom_domain = custom_domain

        # Initialize parent S3Boto3Storage
        super().__init__(**settings)

    def get_accessed_time(self, name: str) -> Optional[object]:
        """
        Override to avoid S3 API calls that Supabase doesn't support.

        Supabase Storage doesn't track accessed time, so we return None.
        """
        return None

    def get_created_time(self, name: str) -> Optional[object]:
        """
        Override to use modified time as created time.

        Supabase Storage uses modified time, not created time.
        """
        return self.get_modified_time(name)


__all__ = ["SupabaseStorage"]

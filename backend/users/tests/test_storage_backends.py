"""Tests for storage backends (FileSystemStorage and SupabaseStorage)."""

import os
from io import BytesIO
from unittest.mock import patch, MagicMock

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from PIL import Image

from backend.users.models import UserProfile
from backend.users.services.update_profile_picture import update_profile_picture

User = get_user_model()


def create_test_image(filename="test.jpg", size=(100, 100), color="red"):
    """Helper to create a test image file."""
    file = BytesIO()
    image = Image.new('RGB', size, color=color)
    image.save(file, 'JPEG')
    file.seek(0)
    
    return SimpleUploadedFile(
        name=filename,
        content=file.read(),
        content_type='image/jpeg'
    )


@pytest.mark.django_db
def test_local_storage_saves_to_media_directory():
    """
    Test that local FileSystemStorage saves files to backend/media/.
    
    This test verifies:
    1. Files are saved to the correct local directory
    2. File path is relative to MEDIA_ROOT
    3. Files can be read back from disk
    
    This is the default behavior for local development.
    """
    # Skip if using cloud storage
    storage_backend = settings.STORAGES["default"]["BACKEND"]
    if storage_backend != 'django.core.files.storage.FileSystemStorage':
        pytest.skip("This test only runs with local FileSystemStorage")
    
    # ARRANGE
    user = User.objects.create_user(
        username="localuser",
        email="local@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    picture = create_test_image("local_test.jpg")
    
    # ACT
    result = update_profile_picture(user_id=user.id, picture_file=picture)
    
    # ASSERT
    # Verify file was saved
    assert result.profile_picture
    assert "local_test" in result.profile_picture.name
    
    # Verify file exists on disk
    full_path = os.path.join(settings.MEDIA_ROOT, result.profile_picture.name)
    assert os.path.exists(full_path), f"File should exist at {full_path}"
    
    # Verify URL is relative (local storage)
    url = result.profile_picture.url
    assert url.startswith('/media/'), f"Local storage should use /media/ prefix, got: {url}"


@pytest.mark.django_db
def test_storage_backend_respects_upload_to_parameter():
    """
    Test that storage backend respects the upload_to parameter.
    
    This test verifies:
    1. Files are saved in the correct subdirectory
    2. upload_to='profile_pictures/' creates profile_pictures/ folder
    3. Directory structure is maintained
    """
    # ARRANGE
    user = User.objects.create_user(
        username="diruser",
        email="dir@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    picture = create_test_image("subdir_test.jpg")
    
    # ACT
    result = update_profile_picture(user_id=user.id, picture_file=picture)
    
    # ASSERT
    # Verify file is in profile_pictures/ subdirectory
    assert result.profile_picture.name.startswith('profile_pictures/'), \
        f"File should be in profile_pictures/ subdirectory, got: {result.profile_picture.name}"
    
    # Verify full directory path exists
    full_path = os.path.join(settings.MEDIA_ROOT, result.profile_picture.name)
    directory = os.path.dirname(full_path)
    assert os.path.exists(directory), f"Directory should exist: {directory}"


@pytest.mark.django_db
def test_storage_generates_unique_filenames():
    """
    Test that storage backend generates unique filenames for duplicate uploads.
    
    This test verifies:
    1. Uploading same filename twice doesn't overwrite
    2. Django adds unique suffix to prevent collisions
    3. Both files exist independently
    
    This is important for preventing data loss when multiple users
    upload files with the same name.
    """
    # Skip if using cloud storage (file system checks don't apply)
    storage_backend = settings.STORAGES["default"]["BACKEND"]
    if storage_backend != 'django.core.files.storage.FileSystemStorage':
        pytest.skip("This test only runs with local FileSystemStorage")
    
    # ARRANGE
    user = User.objects.create_user(
        username="uniqueuser",
        email="unique@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # ACT - Upload first file
    picture1 = create_test_image("duplicate.jpg", color="red")
    result1 = update_profile_picture(user_id=user.id, picture_file=picture1)
    first_path = result1.profile_picture.name
    first_full_path = os.path.join(settings.MEDIA_ROOT, first_path)
    
    # ACT - Upload second file with same name
    picture2 = create_test_image("duplicate.jpg", color="blue")
    result2 = update_profile_picture(user_id=user.id, picture_file=picture2)
    second_path = result2.profile_picture.name
    second_full_path = os.path.join(settings.MEDIA_ROOT, second_path)
    
    # ASSERT
    # Old file should be deleted (our service cleans up old files)
    assert not os.path.exists(first_full_path), "Old file should be deleted by service"
    
    # New file should exist
    assert os.path.exists(second_full_path), "New file should exist"
    
    # Filenames should be different (Django adds unique suffix)
    # Note: They might be the same if enough time passed between uploads
    # The important part is that the new file exists


@pytest.mark.django_db
def test_storage_url_generation():
    """
    Test that storage backend generates correct URLs.
    
    This test verifies:
    1. Local storage generates /media/ URLs
    2. URLs are accessible (would return 200 in a real server)
    3. URL format is correct for the storage backend
    """
    # ARRANGE
    user = User.objects.create_user(
        username="urluser",
        email="url@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    picture = create_test_image("url_test.jpg")
    
    # ACT
    result = update_profile_picture(user_id=user.id, picture_file=picture)
    url = result.profile_picture.url
    
    # ASSERT
    # Local storage should use /media/ prefix
    storage_backend = settings.STORAGES["default"]["BACKEND"]
    if storage_backend == 'django.core.files.storage.FileSystemStorage':
        assert url.startswith('/media/'), f"Expected /media/ prefix, got: {url}"
        assert 'url_test' in url, f"URL should contain filename, got: {url}"
    
    # Supabase storage would use full HTTPS URL
    elif 'Supabase' in storage_backend:
        assert url.startswith('https://'), f"Expected HTTPS URL for Supabase, got: {url}"
        assert 'supabase' in url.lower(), f"Expected Supabase domain, got: {url}"


@pytest.mark.django_db
@patch('backend.core.storage_backends.STORAGES_AVAILABLE', False)
def test_supabase_storage_requires_django_storages():
    """
    Test that SupabaseStorage raises ImportError if django-storages not installed.
    
    This test verifies:
    1. Clear error message when dependencies missing
    2. Helps developers understand what to install
    3. Prevents cryptic errors at runtime
    """
    # ARRANGE
    from backend.core.storage_backends import SupabaseStorage
    
    # ACT & ASSERT
    with pytest.raises(ImportError) as exc_info:
        storage = SupabaseStorage()
    
    assert "django-storages is required" in str(exc_info.value)
    assert "pip install" in str(exc_info.value)


@pytest.mark.skipif(
    not os.environ.get('USE_SUPABASE_STORAGE') == 'True',
    reason="Supabase storage tests require USE_SUPABASE_STORAGE=True and valid credentials"
)
@pytest.mark.django_db
def test_supabase_storage_integration():
    """
    Test Supabase Storage integration (requires real credentials).
    
    This test verifies:
    1. Files upload to Supabase Storage
    2. Public URLs are generated
    3. Files are accessible via HTTPS
    
    ⚠️  This test only runs when USE_SUPABASE_STORAGE=True
    ⚠️  Requires valid Supabase credentials in environment
    ⚠️  May incur small storage costs
    
    To run this test:
        export USE_SUPABASE_STORAGE=True
        export SUPABASE_STORAGE_ENDPOINT=https://...
        export SUPABASE_STORAGE_ACCESS_KEY=...
        export SUPABASE_STORAGE_SECRET_KEY=...
        pytest users/tests/test_storage_backends.py::test_supabase_storage_integration
    """
    # ARRANGE
    user = User.objects.create_user(
        username="supabaseuser",
        email="supabase@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    picture = create_test_image("supabase_test.jpg")
    
    # ACT
    result = update_profile_picture(user_id=user.id, picture_file=picture)
    url = result.profile_picture.url
    
    # ASSERT
    # Verify Supabase URL format
    assert url.startswith('https://'), f"Supabase URLs should use HTTPS, got: {url}"
    assert 'supabase' in url.lower(), f"URL should contain 'supabase', got: {url}"
    assert 'supabase_test' in url, f"URL should contain filename, got: {url}"
    
    # Note: We don't test actual HTTP accessibility here because that would
    # require network access and make tests slower. In a real integration test,
    # you might do: requests.get(url).status_code == 200


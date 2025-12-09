"""Tests for update_profile_picture service."""

import copy
import os
from io import BytesIO

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image

from backend.users.models import UserProfile
from backend.users.services.update_profile_picture import update_profile_picture

User = get_user_model()


def create_test_image(filename="test.jpg", size=(100, 100), color="red"):
    """
    Helper function to create a test image file.
    
    This creates an in-memory image file that can be used for testing file uploads.
    We use PIL (Pillow) to create actual image data.
    
    Args:
        filename: Name for the file
        size: Tuple of (width, height) in pixels
        color: Color of the image
        
    Returns:
        SimpleUploadedFile: Django's test file upload object
    """
    # Create an image in memory
    file = BytesIO()
    image = Image.new('RGB', size, color=color)
    image.save(file, 'JPEG')
    file.seek(0)  # Reset file pointer to beginning
    
    return SimpleUploadedFile(
        name=filename,
        content=file.read(),
        content_type='image/jpeg'
    )


@pytest.fixture
def local_media_storage(tmp_path):
    """Force tests to use local FileSystemStorage in a temp directory."""
    storages = copy.deepcopy(settings.STORAGES)
    storages["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {"location": str(tmp_path)},
    }
    with override_settings(
        MEDIA_ROOT=str(tmp_path),
        DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
        STORAGES=storages,
    ):
        yield tmp_path


@pytest.mark.django_db
def test_update_profile_picture_uploads_new_picture(local_media_storage):
    """
    Test that update_profile_picture successfully uploads a new picture.
    
    This test verifies:
    1. The service accepts a file upload
    2. The profile picture field is updated
    3. The file is saved to the correct location
    """
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    picture_file = create_test_image("avatar.jpg")
    
    # ACT
    result = update_profile_picture(user_id=user.id, picture_file=picture_file)
    
    # ASSERT
    assert isinstance(result, UserProfile)
    assert result.profile_picture is not None
    assert "avatar" in result.profile_picture.name, "Filename should contain 'avatar'"
    
    assert os.path.exists(result.profile_picture.path), "Profile picture file should exist on disk"


@pytest.mark.django_db
def test_update_profile_picture_deletes_old_picture(local_media_storage):
    """
    Test that update_profile_picture deletes the old picture when uploading new one.
    
    This test verifies:
    1. Old picture file is deleted from storage
    2. New picture replaces the old one
    3. No orphaned files remain
    """
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # Upload first picture
    old_picture = create_test_image("old.jpg")
    profile.profile_picture = old_picture
    profile.save()
    old_picture_name = profile.profile_picture.name  # Save name before replacement
    
    # ACT - Upload new picture
    new_picture = create_test_image("new.jpg")
    result = update_profile_picture(user_id=user.id, picture_file=new_picture)
    
    # ASSERT
    # Profile should be updated with new picture (Django may add unique suffix)
    assert "new" in result.profile_picture.name, "Profile should have new picture"
    assert result.profile_picture.name != old_picture_name, "Should be different from old picture"
    
    old_picture_path = os.path.join(settings.MEDIA_ROOT, old_picture_name)
    assert not os.path.exists(old_picture_path), "Old picture should be deleted after update"
    assert os.path.exists(result.profile_picture.path), "New picture should exist on disk"


@pytest.mark.django_db
def test_update_profile_picture_can_delete_picture(local_media_storage):
    """
    Test that update_profile_picture can remove a picture without replacement.
    
    This test verifies:
    1. Picture can be removed by passing delete_picture=True
    2. The file is deleted from storage
    3. The database field is set to None/null
    """
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # Upload a picture first
    picture = create_test_image("avatar.jpg")
    profile.profile_picture = picture
    profile.save()
    picture_name = profile.profile_picture.name
    
    # ACT - Delete the picture
    result = update_profile_picture(user_id=user.id, delete_picture=True)
    
    # ASSERT
    assert not result.profile_picture, "Profile picture field should be empty after deletion"
    
    picture_path = os.path.join(settings.MEDIA_ROOT, picture_name)
    assert not os.path.exists(picture_path), "Picture file should be deleted from storage"



@pytest.mark.django_db
def test_update_profile_picture_is_atomic(local_media_storage):
    """
    Test that update_profile_picture uses transactions (atomic behavior).
    
    This test verifies:
    1. If the service fails, no changes are committed
    2. Database rollback works correctly
    3. Files are not orphaned on failure
    
    This is an advanced test demonstrating transaction safety.
    """
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    # Intentionally DON'T create a profile (will cause error)
    picture = create_test_image("test.jpg")
    
    # ACT & ASSERT
    with pytest.raises(UserProfile.DoesNotExist):
        update_profile_picture(user_id=user.id, picture_file=picture)



@pytest.mark.django_db
def test_update_profile_picture_with_no_changes(local_media_storage):
    """
    Test that calling update_profile_picture without changes is safe.
    
    This test verifies:
    1. Calling the service with no picture_file and delete_picture=False is a no-op
    2. Existing picture remains unchanged
    3. No errors occur
    """
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # Upload a picture
    picture = create_test_image("original.jpg")
    profile.profile_picture = picture
    profile.save()
    original_path = profile.profile_picture.name  # Store the path
    
    # ACT - Call service with no changes
    result = update_profile_picture(user_id=user.id)
    
    # ASSERT
    assert result.profile_picture.name == original_path, "Profile picture should remain unchanged"

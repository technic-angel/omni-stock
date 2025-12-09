"""Tests for user profile update endpoint."""

from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import pytest
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from PIL import Image

from backend.users.models import UserProfile
from backend.vendors.models import Vendor

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_with_profile(db):
    """Create a user with profile."""
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    # Explicitly create profile (no auto-signal in this project)
    UserProfile.objects.create(user=user)
    return user


@pytest.fixture
def vendor(db):
    """Create a test vendor."""
    return Vendor.objects.create(
        name="Test Vendor",
        description="Test vendor description"
    )


@pytest.fixture
def authenticated_client(api_client, user_with_profile):
    """Return an authenticated API client."""
    api_client.force_authenticate(user=user_with_profile)
    return api_client


@pytest.fixture
def media_root(tmp_path, settings):
    """Use an isolated MEDIA_ROOT for file upload tests."""
    media_dir = tmp_path / "test_media"
    media_dir.mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = str(media_dir)
    return media_dir


@pytest.fixture
def local_default_storage(monkeypatch, settings, media_root):
    """Force serializers to use FileSystemStorage instead of Supabase during tests."""
    storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    monkeypatch.setattr("backend.users.api.serializers.default_storage", storage)
    return storage


@pytest.mark.django_db
def test_update_profile_bio_and_phone(authenticated_client, user_with_profile):
    """Test updating bio and phone fields."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"bio": "New bio text", "phone": "555-1234"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["profile"]["bio"] == "New bio text"
    assert response.data["profile"]["phone"] == "555-1234"
    
    # Verify in database
    user_with_profile.refresh_from_db()
    assert user_with_profile.profile.bio == "New bio text"
    assert user_with_profile.profile.phone == "555-1234"


@pytest.mark.django_db
def test_update_username(authenticated_client, user_with_profile):
    """Test updating username."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"username": "newusername"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["username"] == "newusername"


@pytest.mark.django_db
def test_update_email(authenticated_client, user_with_profile):
    """Test updating email."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"email": "newemail@example.com"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == "newemail@example.com"


@pytest.mark.django_db
def test_update_first_and_last_name(authenticated_client, user_with_profile):
    """Test updating first/last name fields."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"first_name": "Melissa", "last_name": "Berumen"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["first_name"] == "Melissa"
    assert response.data["last_name"] == "Berumen"

    user_with_profile.refresh_from_db()
    assert user_with_profile.first_name == "Melissa"
    assert user_with_profile.last_name == "Berumen"


@pytest.mark.django_db
def test_update_username_duplicate_rejected(authenticated_client, user_with_profile, db):
    """Test that duplicate username is rejected."""
    # Create another user
    User.objects.create_user(
        username="existinguser",
        email="existing@example.com",
        password="pass123"
    )
    
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"username": "existinguser"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "username" in response.data


@pytest.mark.django_db
def test_link_user_to_vendor(authenticated_client, user_with_profile, vendor):
    """Test linking user to vendor."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"vendor_id": vendor.id},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["profile"]["vendor_id"] == vendor.id
    assert response.data["profile"]["vendor_name"] == vendor.name


@pytest.mark.django_db
def test_clear_vendor_association(authenticated_client, user_with_profile, vendor):
    """Test clearing vendor association."""
    # First link to vendor
    user_with_profile.profile.vendor = vendor
    user_with_profile.profile.save()
    
    # Now clear it
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"vendor_id": None},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data["profile"]["vendor_id"] is None


@pytest.mark.django_db
def test_invalid_vendor_rejected(authenticated_client, user_with_profile):
    """Test that invalid vendor ID is rejected."""
    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"vendor_id": 99999},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "vendor_id" in response.data


@pytest.mark.django_db
def test_update_requires_authentication(api_client):
    """Test that update requires authentication."""
    response = api_client.patch(
        "/api/v1/auth/me/",
        data={"bio": "test"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_update_profile_handles_media_payload(authenticated_client, user_with_profile):
    """Ensure avatar payload creates a UserMedia row and can be cleared."""
    payload = {
        "avatar": {
            "media_type": "profile_avatar",
            "url": "https://cdn.dev/avatar.png",
            "width": 200,
            "height": 200,
        }
    }
    response = authenticated_client.patch("/api/v1/auth/me/", data=payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    user_with_profile.refresh_from_db()
    assert user_with_profile.media_files.filter(media_type="profile_avatar").count() == 1

    clear_response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"avatar": None},
        format="json",
    )
    assert clear_response.status_code == status.HTTP_200_OK
    user_with_profile.refresh_from_db()
    assert not user_with_profile.media_files.filter(media_type="profile_avatar").exists()


def _sample_image_bytes(color="red"):
    """Generate raw bytes for a tiny PNG."""
    file = BytesIO()
    image = Image.new("RGB", (5, 5), color=color)
    image.save(file, "PNG")
    file.seek(0)
    return file.read()


def _path_from_profile_url(url, media_root):
    parsed = urlparse(url)
    relative = parsed.path.split("/media/", 1)[-1]
    return Path(media_root) / relative


@pytest.mark.django_db
def test_profile_picture_uploads_file(
    authenticated_client, user_with_profile, media_root, local_default_storage
):
    """Uploading a multipart profile_picture should persist and return a public URL."""
    file = SimpleUploadedFile("avatar.png", _sample_image_bytes(), content_type="image/png")

    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"profile_picture": file, "bio": "Has image"},
        format="multipart",
    )

    assert response.status_code == status.HTTP_200_OK
    profile_url = response.data["profile"]["profile_picture"]
    assert profile_url
    assert profile_url.startswith("http://testserver/media/profile_pictures/")

    stored_path = _path_from_profile_url(profile_url, media_root)
    assert stored_path.exists(), "Uploaded profile picture should exist on disk"

    user_with_profile.refresh_from_db()
    assert user_with_profile.profile.profile_picture == profile_url


@pytest.mark.django_db
def test_profile_picture_can_be_deleted(
    authenticated_client, user_with_profile, media_root, local_default_storage
):
    """The delete_profile_picture flag should remove the stored file and clear the field."""
    upload = SimpleUploadedFile("avatar.png", _sample_image_bytes(), content_type="image/png")
    resp = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"profile_picture": upload},
        format="multipart",
    )
    assert resp.status_code == status.HTTP_200_OK
    profile_url = resp.data["profile"]["profile_picture"]
    stored_path = _path_from_profile_url(profile_url, media_root)
    assert stored_path.exists()

    delete_resp = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"delete_profile_picture": True},
        format="json",
    )
    assert delete_resp.status_code == status.HTTP_200_OK
    assert delete_resp.data["profile"]["profile_picture"] is None

    user_with_profile.refresh_from_db()
    assert user_with_profile.profile.profile_picture is None
    assert not stored_path.exists(), "Stored file should be removed after deletion"

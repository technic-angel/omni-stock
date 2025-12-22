"""Tests for user profile update endpoint."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from backend.users.models import UserProfile

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
def authenticated_client(api_client, user_with_profile):
    """Return an authenticated API client."""
    api_client.force_authenticate(user=user_with_profile)
    return api_client



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
        data={"first_name": "Melissa", "last_name": "Lopez"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["first_name"] == "Melissa"
    assert response.data["last_name"] == "Lopez"

    user_with_profile.refresh_from_db()
    assert user_with_profile.first_name == "Melissa"
    assert user_with_profile.last_name == "Lopez"


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


@pytest.mark.django_db
def test_profile_picture_accepts_supabase_url(authenticated_client, user_with_profile):
    """Supplying a Supabase URL should persist and echo back in the response."""
    supabase_url = "https://cdn.supabase.io/storage/v1/object/public/profile-avatars/avatar.png"

    response = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"profile_picture_url": supabase_url, "bio": "Has image"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["profile"]["profile_picture"] == supabase_url

    user_with_profile.refresh_from_db()
    assert user_with_profile.profile.profile_picture == supabase_url
    assert user_with_profile.profile.bio == "Has image"


@pytest.mark.django_db
def test_profile_picture_can_be_deleted(authenticated_client, user_with_profile):
    """The delete_profile_picture flag should clear the stored URL."""
    user_with_profile.profile.profile_picture = "https://cdn.supabase.io/storage/v1/object/public/profile-avatars/old.png"
    user_with_profile.profile.save()

    delete_resp = authenticated_client.patch(
        "/api/v1/auth/me/",
        data={"delete_profile_picture": True},
        format="json",
    )

    assert delete_resp.status_code == status.HTTP_200_OK
    assert delete_resp.data["profile"]["profile_picture"] is None

    user_with_profile.refresh_from_db()
    assert user_with_profile.profile.profile_picture is None

"""Tests for user profile update endpoint."""

import pytest
from backend.users.models import UserProfile
from backend.vendors.models import Vendor
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

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

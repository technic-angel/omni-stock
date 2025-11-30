"""Tests for /api/v1/auth/me/ endpoint (CurrentUserView)."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.users.models import UserProfile
from backend.users.services.create_user import create_user

User = get_user_model()


@pytest.mark.django_db
def test_me_endpoint_requires_authentication():
    """
    Test that /me endpoint requires authentication.
    
    This test verifies:
    1. Unauthenticated requests are rejected
    2. Response status code is 401 (Unauthorized)
    3. Access is properly protected
    
    This is a security test - we want to ensure users can't access
    the endpoint without being logged in.
    """
    # ARRANGE
    client = APIClient()
    # Note: We deliberately DON'T authenticate the client
    
    # ACT
    response = client.get("/api/v1/auth/me/")
    
    # ASSERT
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_endpoint_returns_user_data():
    """
    Test that /me endpoint returns authenticated user's data.
    
    This test verifies:
    1. Authenticated requests succeed
    2. Response contains correct user data
    3. Response includes nested profile data
    4. Status code is 200 (OK)
    
    This is the main happy path test - verifying the endpoint works correctly.
    """
    # ARRANGE
    # Create a user with a profile (use create_user service to ensure profile is created)
    user = create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    
    # Authenticate the client
    client = APIClient()
    client.force_authenticate(user=user)
    
    # ACT
    response = client.get("/api/v1/auth/me/")
    
    # ASSERT
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert response.json()["email"] == "test@example.com"
    assert "profile" in response.json()


@pytest.mark.django_db
def test_me_endpoint_includes_profile_picture():
    """
    Test that /me endpoint includes profile_picture URL when set.
    
    This test verifies:
    1. Profile picture URL is included in response
    2. URL is properly formatted (not None, not empty)
    3. Nested profile data contains profile_picture field
    
    This tests the integration between the UserProfile model,
    the serializer, and the API endpoint.
    """
    # ARRANGE
    user = create_user(
        username="picuser",
        email="pic@example.com",
        password="testpass123"
    )
    
    # Add a profile picture to the user's profile
    profile = UserProfile.objects.get(user=user)
    profile.profile_picture = "profile_pictures/test.jpg"  # Simulate uploaded file
    profile.save()
    
    # Authenticate the client
    client = APIClient()
    client.force_authenticate(user=user)
    
    # ACT
    response = client.get("/api/v1/auth/me/")
    data = response.json()
    
    # ASSERT
    assert data["profile"]["profile_picture"] is not None
    assert "test.jpg" in data["profile"]["profile_picture"]
    assert data["profile"]["profile_picture"] != ""


@pytest.mark.django_db
def test_me_endpoint_with_no_profile_picture():
    """
    Test that /me endpoint works when user has no profile picture.
    
    This test verifies:
    1. Endpoint works even without a profile picture
    2. profile_picture field is None/null when not set
    3. No errors occur with missing profile picture
    
    This is an edge case test - ensuring the endpoint handles
    optional fields gracefully.
    """
    # ARRANGE
    user = create_user(
        username="nopic",
        email="nopic@example.com",
        password="testpass123"
    )
    # Profile is created by create_user service, but has no profile_picture
    
    # Authenticate the client
    client = APIClient()
    client.force_authenticate(user=user)
    
    # ACT
    response = client.get("/api/v1/auth/me/")
    data = response.json()
    
    # ASSERT
    assert data["profile"]["profile_picture"] is None



@pytest.mark.django_db
def test_me_endpoint_only_returns_own_data():
    """
    Test that /me endpoint only returns the authenticated user's data.
    
    This test verifies:
    1. User A cannot see User B's data
    2. Each user only sees their own information
    3. Authentication properly isolates user data
    
    This is a security test - ensuring users can't access other users' data.
    """
    # ARRANGE
    # Create two different users
    user1 = create_user(
        username="user1",
        email="user1@example.com",
        password="pass123"
    )
    user2 = create_user(
        username="user2",
        email="user2@example.com",
        password="pass123"
    )
    
    # Authenticate as user1
    client = APIClient()
    client.force_authenticate(user=user1)
    
    # ACT
    response = client.get("/api/v1/auth/me/")
    data = response.json()
    
    # ASSERT
    assert data["username"] == "user1"
    assert data["email"] == "user1@example.com"
    assert data["username"] != "user2"


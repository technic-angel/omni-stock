"""Tests for logout endpoint with token blacklisting."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )


@pytest.fixture
def auth_tokens(user):
    """Get JWT tokens for user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }


@pytest.fixture
def authenticated_client(api_client, auth_tokens):
    """Return an API client with auth header set."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
    return api_client


@pytest.mark.django_db
def test_logout_success(authenticated_client, auth_tokens):
    """Test successful logout blacklists the refresh token."""
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "logged out" in response.data["detail"].lower()


@pytest.mark.django_db
def test_logout_requires_authentication(api_client, auth_tokens):
    """Test logout requires authentication."""
    response = api_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_logout_missing_refresh_token(authenticated_client):
    """Test logout fails without refresh token."""
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "refresh" in response.data


@pytest.mark.django_db
def test_logout_invalid_refresh_token(authenticated_client):
    """Test logout fails with invalid refresh token."""
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": "invalid-token"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_logout_token_cannot_be_reused(authenticated_client, auth_tokens, api_client):
    """Test that blacklisted token cannot be used again."""
    # First, logout (blacklist the token)
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Try to use blacklisted refresh token to get new access token
    response = api_client.post(
        "/api/v1/auth/token/refresh/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    
    # Should fail because token is blacklisted
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_logout_twice_fails(authenticated_client, auth_tokens):
    """Test that logging out twice with same token fails."""
    # First logout
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Second logout with same token should fail
    response = authenticated_client.post(
        "/api/v1/auth/logout/",
        data={"refresh": auth_tokens["refresh"]},
        format="json"
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

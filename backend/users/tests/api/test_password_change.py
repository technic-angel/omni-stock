"""Tests for password change endpoint."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

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
        password="oldpassword123"
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Return an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.mark.django_db
def test_change_password_success(authenticated_client, user):
    """Test successful password change."""
    response = authenticated_client.post(
        "/api/v1/auth/password/change/",
        data={
            "old_password": "oldpassword123",
            "new_password": "newpassword456"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "Password changed successfully" in response.data["detail"]
    
    # Verify new password works
    user.refresh_from_db()
    assert user.check_password("newpassword456")


@pytest.mark.django_db
def test_change_password_wrong_old_password(authenticated_client, user):
    """Test password change with wrong current password."""
    response = authenticated_client.post(
        "/api/v1/auth/password/change/",
        data={
            "old_password": "wrongpassword",
            "new_password": "newpassword456"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "old_password" in response.data


@pytest.mark.django_db
def test_change_password_weak_new_password(authenticated_client, user):
    """Test password change with weak new password."""
    response = authenticated_client.post(
        "/api/v1/auth/password/change/",
        data={
            "old_password": "oldpassword123",
            "new_password": "123"  # Too short
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_change_password_requires_authentication(api_client):
    """Test that password change requires authentication."""
    response = api_client.post(
        "/api/v1/auth/password/change/",
        data={
            "old_password": "oldpassword123",
            "new_password": "newpassword456"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_change_password_missing_fields(authenticated_client):
    """Test password change with missing fields."""
    response = authenticated_client.post(
        "/api/v1/auth/password/change/",
        data={},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "old_password" in response.data
    assert "new_password" in response.data

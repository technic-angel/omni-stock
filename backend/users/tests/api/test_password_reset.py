"""Tests for password reset endpoints."""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
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
        password="testpass123"
    )


@pytest.fixture
def token_generator():
    return PasswordResetTokenGenerator()


@pytest.mark.django_db
def test_password_reset_request_success(api_client, user):
    """Test requesting password reset."""
    response = api_client.post(
        "/api/v1/auth/password/reset/",
        data={"email": "test@example.com"},
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    # Always succeeds to prevent email enumeration
    assert "password reset link has been sent" in response.data["detail"].lower()


@pytest.mark.django_db
def test_password_reset_request_nonexistent_email(api_client):
    """Test requesting reset for non-existent email still succeeds."""
    response = api_client.post(
        "/api/v1/auth/password/reset/",
        data={"email": "nonexistent@example.com"},
        format="json"
    )
    
    # Should still return success to prevent email enumeration
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_password_reset_request_missing_email(api_client):
    """Test requesting reset without email fails."""
    response = api_client.post(
        "/api/v1/auth/password/reset/",
        data={},
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in response.data


@pytest.mark.django_db
def test_password_reset_confirm_success(api_client, user, token_generator):
    """Test confirming password reset with valid token."""
    token = token_generator.make_token(user)
    
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": user.id,
            "token": token,
            "new_password": "newstrongpassword123"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    # Verify new password works
    user.refresh_from_db()
    assert user.check_password("newstrongpassword123")


@pytest.mark.django_db
def test_password_reset_confirm_invalid_token(api_client, user):
    """Test confirming reset with invalid token fails."""
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": user.id,
            "token": "invalid-token",
            "new_password": "newstrongpassword123"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_password_reset_confirm_invalid_user(api_client):
    """Test confirming reset with invalid user ID fails."""
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": 99999,
            "token": "some-token",
            "new_password": "newstrongpassword123"
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_password_reset_confirm_weak_password(api_client, user, token_generator):
    """Test confirming reset with weak password fails."""
    token = token_generator.make_token(user)
    
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": user.id,
            "token": token,
            "new_password": "123"  # Too short/weak
        },
        format="json"
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_password_reset_token_invalid_after_use(api_client, user, token_generator):
    """Test that token becomes invalid after use."""
    token = token_generator.make_token(user)
    
    # First use - should succeed
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": user.id,
            "token": token,
            "new_password": "newstrongpassword123"
        },
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Second use - should fail (token invalidated after password change)
    response = api_client.post(
        "/api/v1/auth/password/reset/confirm/",
        data={
            "uid": user.id,
            "token": token,
            "new_password": "anotherpassword456"
        },
        format="json"
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

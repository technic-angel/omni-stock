import pytest
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_check_email_available():
    """Test checking an available email."""
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/check-email/",
        {"email": "available@example.com"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json() == {'available': True}

@pytest.mark.django_db
def test_check_email_exists(db):
    """Test checking an existing email."""

    #arrange
    # Create a user with the email
    User.objects.create_user(
        username="existinguser",
        email="existing@example.com",
        password="pass123"
    )

    #act
    # Check the email endpoint
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/check-email/",
        {"email": "existing@example.com"},
        format="json",
    )

    #assert
    assert response.status_code == 200
    assert response.json() == {'available': False}


def test_check_email_invalid_format():
    """Test checking an invalid email format."""
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/check-email/",
        {"email": "invalid-email-format"},
        format="json",
    )

    assert response.status_code == 400
    assert "email" in response.json()

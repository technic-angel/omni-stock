import pytest

from backend.users.services.create_user import create_user
from django.contrib.auth import get_user_model
from backend.users.models import UserProfile

User = get_user_model()


@pytest.mark.django_db
def test_create_user_service_creates_profile():
    user = create_user(username="serviceuser", password="Strongpass123", email="service@example.com")

    assert User.objects.filter(username="serviceuser").exists()
    assert UserProfile.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_create_user_service_extra_fields():
    user = create_user(
        username="extrauser",
        password="Strongpass123",
        extra_fields={"first_name": "Extra"},
    )

    assert user.first_name == "Extra"

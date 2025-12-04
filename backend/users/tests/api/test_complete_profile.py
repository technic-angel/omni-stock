import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.users.models import UserRole
from backend.users.services.create_user import create_user

User = get_user_model()


@pytest.mark.django_db
def test_complete_profile_requires_auth():
    client = APIClient()
    resp = client.post("/api/v1/auth/profile/complete/", {}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_complete_profile_updates_user_fields():
    user = create_user(username="onboard", email="onboard@example.com", password="Temp12345")
    client = APIClient()
    client.force_authenticate(user=user)

    payload = {
        "username": "onboard_final",
        "password": "NewSecurePass!123",
        "company_name": "Onboard Co",
        "company_site": "https://onboard.example.com",
        "company_code": "INV777",
        "phone_number": "+15555550123",
        "birthdate": "1990-01-01",
        "role": UserRole.ADMIN,
    }
    resp = client.post("/api/v1/auth/profile/complete/", payload, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.username == "onboard_final"
    assert user.company_name == "Onboard Co"
    assert user.profile_completed is True
    assert user.check_password("NewSecurePass!123")

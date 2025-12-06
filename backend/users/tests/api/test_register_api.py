from datetime import date, timedelta

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.users.models import UserProfile

User = get_user_model()
DEFAULT_BIRTHDATE = "1990-01-01"


@pytest.mark.django_db
def test_register_success():
    client = APIClient()
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongpass123",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("username") == "newuser"
    user = User.objects.get(username="newuser")
    assert user.email == "newuser@example.com"
    assert user.profile_completed is True


@pytest.mark.django_db
def test_registration_creates_userprofile():
    client = APIClient()
    payload = {
        "username": "profileuser",
        "password": "strongpassword123",
        "email": "p@example.com",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    user = User.objects.get(username="profileuser")
    profile = UserProfile.objects.get(user=user)
    assert profile.user_id == user.id


@pytest.mark.django_db
def test_register_duplicate_username():
    User.objects.create_user(username="dupuser", password="hunter2", email="dup@example.com")
    client = APIClient()
    payload = {
        "username": "dupuser",
        "password": "anotherpass123",
        "email": "unique@example.com",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_duplicate_email():
    User.objects.create_user(username="dupemail", password="hunter2", email="dup@example.com")
    client = APIClient()
    payload = {
        "username": "anotheruser",
        "password": "anotherpass123",
        "email": "dup@example.com",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_weak_password_rejected():
    client = APIClient()
    payload = {
        "username": "weak",
        "password": "short",
        "email": "weak@example.com",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_missing_email_rejected():
    client = APIClient()
    payload = {"username": "noemail", "password": "Validpass123", "birthdate": DEFAULT_BIRTHDATE}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_and_token_flow():
    client = APIClient()
    payload = {
        "username": "e2e_user",
        "email": "e2e@example.com",
        "password": "ComplexPass123!",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201

    token_url = "/api/v1/auth/token/"
    login = client.post(token_url, {"username": "e2e_user", "password": "ComplexPass123!"}, format="json")
    assert login.status_code == 200
    tokens = login.json()
    assert "access" in tokens and "refresh" in tokens

    refresh_url = "/api/v1/auth/token/refresh/"
    refreshed = client.post(refresh_url, {"refresh": tokens["refresh"]}, format="json")
    assert refreshed.status_code == 200
    assert "access" in refreshed.json()


@pytest.mark.django_db
def test_token_invalid_credentials():
    client = APIClient()
    resp = client.post("/api/v1/auth/token/", {"username": "nope", "password": "bad"}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_register_with_company_details():
    client = APIClient()
    payload = {
        "username": "vendoruser",
        "email": "vendor@example.com",
        "password": "ComplexPass123!",
        "company_name": "Vendor Co",
        "company_code": "INVITE123",
        "birthdate": DEFAULT_BIRTHDATE,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    user = User.objects.get(username="vendoruser")
    assert user.company_name == "Vendor Co"
    assert user.company_code == "INVITE123"


@pytest.mark.django_db
def test_register_with_birthdate():
    client = APIClient()
    payload = {
        "username": "birthdayuser",
        "email": "birthday@example.com",
        "password": "ComplexPass123!",
        "birthdate": "1990-05-10",
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    user = User.objects.get(username="birthdayuser")
    assert user.birthdate.isoformat() == "1990-05-10"


@pytest.mark.django_db
def test_register_rejects_invalid_birthdate():
    client = APIClient()
    future_date = (date.today() + timedelta(days=1)).isoformat()
    payload = {
        "username": "futureuser",
        "email": "future@example.com",
        "password": "ComplexPass123!",
        "birthdate": future_date,
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400
    assert resp.json()["birthdate"] == ["Birthdate cannot be in the future."]


@pytest.mark.django_db
def test_register_missing_birthdate_rejected():
    client = APIClient()
    payload = {"username": "nobday", "email": "nobday@example.com", "password": "ComplexPass123!"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400
    assert "birthdate" in resp.json()

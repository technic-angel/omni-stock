import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from collectibles.models import UserProfile

User = get_user_model()


@pytest.mark.django_db
def test_register_success():
    client = APIClient()
    payload = {"username": "newuser", "email": "newuser@example.com", "password": "strongpass123"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("username") == "newuser"
    user = User.objects.get(username="newuser")
    assert user.email == "newuser@example.com"


@pytest.mark.django_db
def test_registration_creates_userprofile():
    client = APIClient()
    payload = {"username": "profileuser", "password": "strongpassword123", "email": "p@example.com"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    user = User.objects.get(username="profileuser")
    profile = UserProfile.objects.get(user=user)
    assert profile.user_id == user.id


@pytest.mark.django_db
def test_register_duplicate_username():
    User.objects.create_user(username="dupuser", password="hunter2")
    client = APIClient()
    payload = {"username": "dupuser", "password": "anotherpass123"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_weak_password_rejected():
    client = APIClient()
    payload = {"username": "weak", "password": "short"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_and_token_flow():
    client = APIClient()
    payload = {"username": "e2e_user", "email": "e2e@example.com", "password": "ComplexPass123!"}
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

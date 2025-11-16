import pytest

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_register_success():
    client = APIClient()
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongpass123",
    }
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("username") == "newuser"
    assert User.objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_register_duplicate_username():
    # create existing user
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
def test_token_obtain_and_refresh():
    username = "tokuser"
    password = "verysecurepass"
    User.objects.create_user(username=username, password=password)

    client = APIClient()
    # obtain pair
    resp = client.post("/api/v1/auth/token/", {"username": username, "password": password}, format="json")
    assert resp.status_code == 200
    body = resp.json()
    assert "access" in body and "refresh" in body

    # refresh should return a new access token
    refresh = body.get("refresh")
    resp2 = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format="json")
    assert resp2.status_code == 200
    refreshed = resp2.json()
    assert "access" in refreshed


@pytest.mark.django_db
def test_token_invalid_credentials():
    client = APIClient()
    resp = client.post("/api/v1/auth/token/", {"username": "nope", "password": "bad"}, format="json")
    # SimpleJWT returns 401 for invalid credentials
    assert resp.status_code == 401
import pytest

from rest_framework.test import APIClient


@pytest.mark.django_db
def test_register_and_token_flow():
    client = APIClient()

    register_url = "/api/v1/auth/register/"
    payload = {
        "username": "e2e_user",
        "email": "e2e_user@example.com",
        "password": "ComplexPass123!"
    }

    resp = client.post(register_url, payload, format='json')
    assert resp.status_code == 201
    assert resp.json().get('username') == 'e2e_user'

    # Obtain token via SimpleJWT token endpoint
    token_url = "/api/v1/auth/token/"
    resp = client.post(token_url, {"username": "e2e_user", "password": "ComplexPass123!"}, format='json')
    assert resp.status_code == 200
    data = resp.json()
    assert 'access' in data and 'refresh' in data

    # Refresh the token
    refresh_url = "/api/v1/auth/token/refresh/"
    resp = client.post(refresh_url, {"refresh": data['refresh']}, format='json')
    assert resp.status_code == 200
    assert 'access' in resp.json()

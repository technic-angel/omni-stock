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

import pytest

from django.contrib.auth import get_user_model
from collectibles.models import UserProfile
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_registration_creates_userprofile():
    client = APIClient()
    payload = {"username": "profileuser", "password": "strongpassword123", "email": "p@example.com"}
    resp = client.post("/api/v1/auth/register/", payload, format="json")
    assert resp.status_code == 201
    user = User.objects.get(username="profileuser")
    # Ensure a UserProfile was created and linked
    assert hasattr(user, 'profile')
    profile = UserProfile.objects.get(user=user)
    assert profile.user_id == user.id

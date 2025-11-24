import pytest
from django.contrib.auth import get_user_model

from backend.users.models import UserProfile

User = get_user_model()


@pytest.mark.django_db
def test_user_str_prefers_username():
    user = User.objects.create_user(username="modeluser", email="model@example.com", password="Strongpass123")
    assert str(user) == "modeluser"


@pytest.mark.django_db
def test_user_profile_str():
    user = User.objects.create_user(username="profileuser", email="profile@example.com", password="Strongpass123")
    profile = UserProfile.objects.create(user=user)
    assert "profileuser" in str(profile)

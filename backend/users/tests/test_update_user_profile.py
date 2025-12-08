"""Tests for the update_user_profile service."""

import pytest
from django.contrib.auth import get_user_model

from backend.users.models import UserProfile
from backend.users.services.update_user_profile import update_user_profile

User = get_user_model()


@pytest.mark.django_db
def test_update_user_profile_persists_name_fields():
    """Service should store first/last name updates on the User model."""
    user = User.objects.create_user(username="tester", email="tester@example.com", password="pass1234")
    UserProfile.objects.get_or_create(user=user)

    updated = update_user_profile(user_id=user.id, first_name="Melissa", last_name="Berumen")

    assert updated.first_name == "Melissa"
    assert updated.last_name == "Berumen"

    user.refresh_from_db()
    assert user.first_name == "Melissa"
    assert user.last_name == "Berumen"

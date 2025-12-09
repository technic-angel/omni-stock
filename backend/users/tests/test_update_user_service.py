"""Tests for the update_user service."""

import pytest
from django.contrib.auth import get_user_model

from backend.users.services.update_user import update_user

User = get_user_model()


@pytest.mark.django_db
def test_update_user_mutates_fields_and_saves():
    user = User.objects.create_user(username="before", email="before@example.com", password="pass1234")

    updated = update_user(
        instance=user,
        data={"username": "after", "first_name": "Melissa", "profile_completed": True},
    )

    assert updated.username == "after"
    assert updated.first_name == "Melissa"
    assert updated.profile_completed is True

    user.refresh_from_db()
    assert user.username == "after"
    assert user.first_name == "Melissa"
    assert user.profile_completed is True


@pytest.mark.django_db
def test_update_user_allows_partial_updates():
    user = User.objects.create_user(username="partial", email="partial@example.com", password="pass1234")
    update_user(instance=user, data={})
    user.refresh_from_db()
    assert user.username == "partial"

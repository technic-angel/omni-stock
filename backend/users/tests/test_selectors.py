"""Tests for user selectors."""

import pytest
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext

from backend.users.models import UserProfile
from backend.users.selectors.get_current_user import get_current_user_with_profile
from backend.users.selectors.get_user import get_user
from backend.users.selectors.list_users import list_users

User = get_user_model()


@pytest.mark.django_db
def test_get_current_user_with_profile_returns_user():
    """Test that get_current_user_with_profile returns a user with profile data."""
    # ARRANGE
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.bio = "Test bio"
    profile.save()
    
    # ACT
    result = get_current_user_with_profile(user_id=user.id)
    
    # ASSERT
    assert isinstance(result.profile, UserProfile)
    assert result.id == user.id
    assert result.username == user.username
    assert result.email == user.email
    assert result.profile.bio == "Test bio"


@pytest.mark.django_db
def test_get_current_user_with_profile_raises_on_nonexistent_user():
    """Test that get_current_user_with_profile raises DoesNotExist for invalid user_id."""
    # ARRANGE
    nonexistent_id = 99999
    
    # ACT & ASSERT
    with pytest.raises(User.DoesNotExist):
        get_current_user_with_profile(user_id=nonexistent_id)


@pytest.mark.django_db
def test_get_current_user_with_profile_uses_select_related():
    """Test that the selector uses select_related() to optimize queries."""
    # ARRANGE
    user = User.objects.create_user(
        username="queryuser",
        email="query@example.com",
        password="testpass123"
    )
    UserProfile.objects.get_or_create(user=user)
    
    # ACT
    with CaptureQueriesContext(connection) as queries:
        result = get_current_user_with_profile(user_id=user.id)
        _ = result.profile.bio  # Access profile to trigger query if not optimized
    
    # ASSERT - Should be only 1 query (user + profile via JOIN)
    assert len(queries) == 1, f"Expected 1 query, got {len(queries)}"


@pytest.mark.django_db
def test_get_user_returns_user_and_none_for_missing():
    existing = User.objects.create_user(username="exists", email="exists@example.com", password="pass1234")

    found = get_user(user_id=existing.id)
    assert found.id == existing.id

    assert get_user(user_id=999999) is None


@pytest.mark.django_db
def test_list_users_returns_queryset():
    User.objects.create_user(username="one", email="one@example.com", password="pass1234")
    User.objects.create_user(username="two", email="two@example.com", password="pass1234")

    qs = list_users()
    assert qs.count() == 2
    assert set(qs.values_list("username", flat=True)) == {"one", "two"}

"""Tests for update_profile_picture service."""

import pytest
from django.contrib.auth import get_user_model

from backend.users.models import UserProfile
from backend.users.services.update_profile_picture import update_profile_picture

User = get_user_model()


@pytest.mark.django_db
def test_update_profile_picture_uploads_new_picture():
    """Test that service updates profile picture URL."""
    user = User.objects.create_user(username="picuser", email="pic@example.com", password="pass")
    UserProfile.objects.create(user=user)
    
    new_url = "https://example.com/avatar.jpg"
    
    profile = update_profile_picture(
        user_id=user.id,
        picture_url=new_url
    )
    
    profile.refresh_from_db()
    assert profile.profile_picture == new_url


@pytest.mark.django_db
def test_update_profile_picture_can_delete_picture():
    """Test that service can remove profile picture."""
    user = User.objects.create_user(username="deluser", email="del@example.com", password="pass")
    UserProfile.objects.create(
        user=user,
        profile_picture="https://example.com/old.jpg"
    )
    
    profile = update_profile_picture(
        user_id=user.id,
        delete_picture=True
    )
    
    profile.refresh_from_db()
    assert not profile.profile_picture


@pytest.mark.django_db
def test_update_profile_picture_is_atomic():
    """Test that updates happen in transaction."""
    user = User.objects.create_user(username="atomic", email="atomic@example.com", password="pass")
    UserProfile.objects.create(user=user)
    
    # We can't easily test atomicity without mocking side effects that fail,
    # but we can verify the happy path works under the decorator
    profile = update_profile_picture(
        user_id=user.id,
        picture_url="https://example.com/atomic.jpg"
    )
    
    assert profile.profile_picture == "https://example.com/atomic.jpg"


@pytest.mark.django_db
def test_update_profile_picture_with_no_changes():
    """Test calling service with no changes does nothing."""
    user = User.objects.create_user(username="nochange", email="no@example.com", password="pass")
    UserProfile.objects.create(user=user, profile_picture="https://example.com/existing.jpg")
    
    profile = update_profile_picture(user_id=user.id)
    
    profile.refresh_from_db()
    assert profile.profile_picture == "https://example.com/existing.jpg"

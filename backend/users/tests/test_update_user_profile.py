"""Tests for the update_user_profile service."""

import pytest
from django.contrib.auth import get_user_model

from backend.users.models import UserProfile
from backend.users.services.update_user_profile import update_user_profile
from backend.vendors.models import Vendor

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
@pytest.mark.django_db
def test_update_user_profile_updates_media():
    user = User.objects.create_user(username="media", email="media@example.com", password="pass1234")
    UserProfile.objects.get_or_create(user=user)

    payload = {"url": "https://cdn.dev/avatar.png"}
    update_user_profile(user_id=user.id, avatar=payload)

    media = user.media_files.get(media_type="profile_avatar")
    assert media.url == payload["url"]

    update_user_profile(user_id=user.id, avatar={})
    assert not user.media_files.filter(media_type="profile_avatar").exists()


@pytest.mark.django_db
def test_update_user_profile_sets_and_clears_vendor():
    user = User.objects.create_user(username="vendor", email="vendor@example.com", password="pass1234")
    profile, _ = UserProfile.objects.get_or_create(user=user)
    vendor = Vendor.objects.create(name="Test Vendor")

    update_user_profile(user_id=user.id, vendor_id=vendor.id)
    profile.refresh_from_db()
    assert profile.vendor == vendor

    update_user_profile(user_id=user.id, clear_vendor=True)
    profile.refresh_from_db()
    assert profile.vendor is None


@pytest.mark.django_db
def test_update_user_profile_replaces_profile_picture():
    user = User.objects.create_user(username="pic", email="pic@example.com", password="pass1234")
    profile, _ = UserProfile.objects.get_or_create(user=user)

    first_url = "https://example.com/first.jpg"
    update_user_profile(user_id=user.id, profile_picture=first_url)
    
    profile.refresh_from_db()
    assert profile.profile_picture == first_url

    new_url = "https://example.com/new.jpg"
    update_user_profile(user_id=user.id, profile_picture=new_url)

    profile.refresh_from_db()
    assert profile.profile_picture == new_url


@pytest.mark.django_db
def test_update_user_profile_delete_profile_picture():
    user = User.objects.create_user(username="deletepic", email="deletepic@example.com", password="pass1234")
    profile, _ = UserProfile.objects.get_or_create(user=user)

    url = "https://example.com/keep.jpg"
    update_user_profile(user_id=user.id, profile_picture=url)
    profile.refresh_from_db()
    assert profile.profile_picture == url

    update_user_profile(user_id=user.id, delete_profile_picture=True)

    profile.refresh_from_db()
    assert not profile.profile_picture

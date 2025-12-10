import pytest

from backend.inventory.tests.factories import UserFactory, VendorFactory
from backend.users.models import MediaEntityType, UserMedia, UserMediaType
from backend.users.services.user_media import remove_user_media, upsert_user_media


@pytest.mark.django_db
def test_upsert_creates_and_updates_media():
    user = UserFactory.create()

    payload = {"url": "https://cdn.dev/avatar.png", "width": 512, "height": 512}
    media = upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.PROFILE_AVATAR,
        payload=payload,
    )

    assert media.url == payload["url"]
    assert UserMedia.objects.count() == 1

    payload_update = {"url": "https://cdn.dev/avatar-new.png", "metadata": {"version": 2}}
    media = upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.PROFILE_AVATAR,
        payload=payload_update,
    )
    media.refresh_from_db()

    assert media.url == payload_update["url"]
    assert media.metadata == {"version": 2}
    assert UserMedia.objects.count() == 1  # still a single row
    assert media.entity_type == MediaEntityType.USER
    assert media.entity_id == user.id


@pytest.mark.django_db
def test_remove_user_media_deletes_record(monkeypatch):
    class StubClient:
        def __init__(self):
            self.deleted = []

        def delete_object(self, Bucket, Key):
            self.deleted.append((Bucket, Key))

    stub = StubClient()
    monkeypatch.setattr('backend.users.services.user_media._get_storage_client', lambda: stub)

    user = UserFactory.create()
    upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        payload={
            "url": "https://cdn.dev/logo.png",
            "metadata": {"bucket": "profile-avatars", "path": "avatars/logo.png"},
        },
    )
    assert UserMedia.objects.exists()

    remove_user_media(user_id=user.id, media_type=UserMediaType.VENDOR_LOGO)
    assert not UserMedia.objects.filter(media_type=UserMediaType.VENDOR_LOGO).exists()
    assert stub.deleted == [('profile-avatars', 'avatars/logo.png')]


@pytest.mark.django_db
def test_upsert_with_vendor_entity():
    user = UserFactory.create()
    vendor = VendorFactory.create()

    payload = {
        "url": "https://cdn.dev/logo.png",
        "entity_type": MediaEntityType.VENDOR,
        "entity_id": vendor.id,
    }
    media = upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        payload=payload,
    )

    assert media.entity_type == MediaEntityType.VENDOR
    assert media.entity_id == vendor.id


@pytest.mark.django_db
def test_remove_scoped_by_entity():
    user = UserFactory.create()
    vendor = VendorFactory.create()

    upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        payload={
            "url": "https://cdn.dev/logo.png",
            "entity_type": MediaEntityType.VENDOR,
            "entity_id": vendor.id,
        },
    )
    upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        payload={
            "url": "https://cdn.dev/personal.png",
        },
    )

    remove_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        entity_type=MediaEntityType.VENDOR,
        entity_id=vendor.id,
    )

    assert UserMedia.objects.filter(media_type=UserMediaType.VENDOR_LOGO).count() == 1

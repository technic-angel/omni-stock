import pytest

from backend.inventory.tests.factories import UserFactory
from backend.users.models import UserMedia, UserMediaType
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


@pytest.mark.django_db
def test_remove_user_media_deletes_record():
    user = UserFactory.create()
    upsert_user_media(
        user_id=user.id,
        media_type=UserMediaType.VENDOR_LOGO,
        payload={"url": "https://cdn.dev/logo.png"},
    )
    assert UserMedia.objects.exists()

    remove_user_media(user_id=user.id, media_type=UserMediaType.VENDOR_LOGO)
    assert not UserMedia.objects.filter(media_type=UserMediaType.VENDOR_LOGO).exists()

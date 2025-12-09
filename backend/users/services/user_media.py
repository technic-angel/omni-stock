"""Services for storing user media metadata."""

from django.db import transaction

from backend.users.models import UserMedia, UserMediaType

@transaction.atomic
def upsert_user_media(*, user_id: int, media_type: str, payload: dict) -> UserMedia:
    if media_type not in UserMediaType.values:
        raise ValueError(f"Unsupported media type: {media_type}")

    defaults = {
        'url': payload.get('url'),
        'width': payload.get('width'),
        'height': payload.get('height'),
        'size_kb': payload.get('size_kb'),
        'metadata': payload.get('metadata', {}),
    }

    media, _ = UserMedia.objects.update_or_create(
        user_id=user_id,
        media_type=media_type,
        defaults=defaults,
    )

    return media

@transaction.atomic
def remove_user_media(*, user_id: int, media_type: str) -> None:
    UserMedia.objects.filter(user_id=user_id, media_type=media_type).delete()

__all__ = ["upsert_user_media", "remove_user_media"]

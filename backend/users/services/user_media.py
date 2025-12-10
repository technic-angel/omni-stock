"""Services for storing user media metadata."""

import logging
from typing import Iterable, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.db import transaction

from backend.users.models import MediaEntityType, UserMedia, UserMediaType

logger = logging.getLogger(__name__)

_storage_client: Optional[object] = None


def _get_storage_client():
    """
    Lazily construct an S3 client for Supabase Storage.

    Returns None when the Supabase env vars are not configured (e.g. tests/local).
    """
    global _storage_client
    if _storage_client is not None:
        return _storage_client

    endpoint = getattr(settings, "AWS_S3_ENDPOINT_URL", None)
    access_key = getattr(settings, "AWS_ACCESS_KEY_ID", None)
    secret = getattr(settings, "AWS_SECRET_ACCESS_KEY", None)
    region = getattr(settings, "AWS_S3_REGION_NAME", "us-east-1")

    if not endpoint or not access_key or not secret:
        return None

    _storage_client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret,
        region_name=region,
    )
    return _storage_client


def _delete_remote_media(records: Iterable[UserMedia]):
    client = _get_storage_client()
    if not client:
        return

    for media in records:
        metadata = media.metadata or {}
        bucket = metadata.get("bucket") or getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)
        path = metadata.get("path")
        if not bucket or not path:
            continue
        try:
            client.delete_object(Bucket=bucket, Key=path)
        except (ClientError, BotoCoreError) as exc:
            logger.warning("Failed to delete Supabase object %s/%s: %s", bucket, path, exc)


def _resolve_entity(
    *,
    user_id: int,
    entity_type: Optional[str],
    entity_id: Optional[int],
    payload: dict,
) -> tuple[str, Optional[int]]:
    resolved_type = entity_type or payload.get("entity_type") or MediaEntityType.USER
    if resolved_type not in MediaEntityType.values:
        raise ValueError(f"Unsupported entity type: {resolved_type}")

    resolved_id = entity_id
    if resolved_id is None:
        resolved_id = payload.get("entity_id")
    if resolved_id is None and resolved_type == MediaEntityType.USER:
        resolved_id = user_id
    return resolved_type, resolved_id


@transaction.atomic
def upsert_user_media(
    *,
    user_id: int,
    media_type: str,
    payload: dict,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> UserMedia:
    if media_type not in UserMediaType.values:
        raise ValueError(f"Unsupported media type: {media_type}")

    resolved_entity_type, resolved_entity_id = _resolve_entity(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
    )

    defaults = {
        'url': payload.get('url'),
        'width': payload.get('width'),
        'height': payload.get('height'),
        'size_kb': payload.get('size_kb'),
        'metadata': payload.get('metadata', {}),
        'entity_type': resolved_entity_type,
        'entity_id': resolved_entity_id,
    }

    media, _ = UserMedia.objects.update_or_create(
        user_id=user_id,
        media_type=media_type,
        entity_type=resolved_entity_type,
        entity_id=resolved_entity_id,
        defaults=defaults,
    )

    return media

@transaction.atomic
def remove_user_media(
    *,
    user_id: int,
    media_type: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> None:
    resolved_entity_type, resolved_entity_id = _resolve_entity(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        payload={},
    )
    filters = {
        "user_id": user_id,
        "media_type": media_type,
        "entity_type": resolved_entity_type,
    }
    if resolved_entity_id is None:
        filters["entity_id__isnull"] = True
    else:
        filters["entity_id"] = resolved_entity_id

    qs = UserMedia.objects.filter(**filters)
    media_records = list(qs)
    if media_records:
        _delete_remote_media(media_records)
    qs.delete()

__all__ = ["upsert_user_media", "remove_user_media"]

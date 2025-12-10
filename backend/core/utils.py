"""Core utility helpers."""

from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.utils.text import slugify


def _build_public_url(bucket: str, key: str) -> str | None:
    custom_domain = getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None)
    if not custom_domain:
        return None
    base = custom_domain.rstrip("/")
    if not base.startswith(("http://", "https://")):
        base = f"https://{base}"
    return f"{base}/{key}".replace("//", "/").replace(":/", "://")


def build_supabase_media_path(*, entity: str, identifier: str | int | None, filename: str) -> dict:
    """
    Generate deterministic Supabase metadata (bucket + key) for uploads.

    The caller is still responsible for performing the actual upload; this helper
    simply standardizes how we store metadata for later cleanup.
    """
    bucket_name = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "omni-stock-media")
    entity_segment = slugify(entity or "media") or "media"
    identifier_segment = slugify(str(identifier)) if identifier is not None else "shared"

    extension = Path(filename or "").suffix.lower()
    key = f"{entity_segment}/{identifier_segment}/{uuid.uuid4().hex}{extension}"
    metadata = {"bucket": bucket_name, "path": key}
    public_url = _build_public_url(bucket_name, key)
    if public_url:
        metadata["public_url"] = public_url
    return metadata


def build_product_image_metadata(*, product_id: int, filename: str) -> dict:
    """Convenience wrapper for product/gallery uploads."""
    return build_supabase_media_path(
        entity="product-images",
        identifier=product_id,
        filename=filename,
    )


__all__ = ["build_supabase_media_path", "build_product_image_metadata"]

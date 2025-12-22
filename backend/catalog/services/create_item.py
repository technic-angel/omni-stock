"""Service for creating inventory items and nested card details."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.core.validators import validate_image_url
from backend.catalog.models import CardMetadata, CatalogItem
from backend.catalog.services.media import sync_item_media
from backend.catalog.services.variants import sync_item_variants


def create_item(
    *,
    data: Dict[str, Any],
    card_details_data: Optional[Dict[str, Any]] = None,
    media_payloads: Optional[List[Dict[str, Any]]] = None,
    variant_payloads: Optional[List[Dict[str, Any]]] = None,
) -> CatalogItem:
    """Create a CatalogItem (and optional CardMetadata) inside a transaction."""
    payload = data.copy()
    image_url = payload.get("image_url")
    if image_url:
        validate_image_url(image_url)
    with transaction.atomic():
        item = CatalogItem.objects.create(**payload)
        if card_details_data:
            CardMetadata.objects.create(item=item, **card_details_data)
        if media_payloads is not None:
            sync_item_media(item=item, media_payloads=media_payloads)
        if variant_payloads is not None:
            sync_item_variants(item=item, variants_payload=variant_payloads)
    return item


__all__ = ["create_item"]

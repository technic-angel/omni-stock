"""Service for creating inventory items and nested card details."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.core.validators import validate_image_url
from backend.inventory.models import CardDetails, Collectible
from backend.inventory.services.media import sync_item_media


def create_item(
    *,
    data: Dict[str, Any],
    card_details_data: Optional[Dict[str, Any]] = None,
    media_payloads: Optional[List[Dict[str, Any]]] = None,
) -> Collectible:
    """Create a Collectible (and optional CardDetails) inside a transaction."""
    payload = data.copy()
    image_url = payload.get("image_url")
    if image_url:
        validate_image_url(image_url)
    with transaction.atomic():
        collectible = Collectible.objects.create(**payload)
        if card_details_data:
            CardDetails.objects.create(collectible=collectible, **card_details_data)
        if media_payloads is not None:
            sync_item_media(item=collectible, media_payloads=media_payloads)
    return collectible


__all__ = ["create_item"]

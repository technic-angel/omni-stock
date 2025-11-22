"""Service for creating inventory items and nested card details."""

from typing import Any, Dict, Optional

from django.db import transaction

from backend.inventory.models import CardDetails, Collectible
from backend.core.validators import validate_image_url


def create_item(
    *,
    data: Dict[str, Any],
    card_details_data: Optional[Dict[str, Any]] = None,
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
    return collectible


__all__ = ["create_item"]

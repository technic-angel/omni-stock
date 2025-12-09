"""Service for updating inventory items and nested card details."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.core.validators import validate_image_url
from backend.inventory.models import CardDetails, Collectible
from backend.inventory.services.media import sync_item_media


def update_item(
    *,
    instance: Collectible,
    data: Dict[str, Any],
    card_details_data: Optional[Dict[str, Any]] = None,
    media_payloads: Optional[List[Dict[str, Any]]] = None,
) -> Collectible:
    """Update a Collectible (and optional CardDetails) inside a transaction."""
    with transaction.atomic():
        image_url = data.get("image_url")
        if image_url:
            validate_image_url(image_url)
        for attr, value in data.items():
            setattr(instance, attr, value)
        instance.save()

        if card_details_data is not None:
            card_details = getattr(instance, "card_details", None)
            if card_details:
                for attr, value in card_details_data.items():
                    setattr(card_details, attr, value)
                card_details.save()
            else:
                CardDetails.objects.create(collectible=instance, **card_details_data)
        if media_payloads is not None:
            sync_item_media(item=instance, media_payloads=media_payloads)
    return instance


__all__ = ["update_item"]

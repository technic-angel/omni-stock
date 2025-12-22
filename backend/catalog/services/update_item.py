"""Service for updating inventory items and nested card details."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.catalog.models import CardMetadata, CatalogItem
from backend.catalog.services.media import sync_item_media
from backend.catalog.services.variants import sync_item_variants
from backend.core.validators import validate_image_url


def update_item(
    *,
    instance: CatalogItem,
    data: Dict[str, Any],
    card_details_data: Optional[Dict[str, Any]] = None,
    media_payloads: Optional[List[Dict[str, Any]]] = None,
    variant_payloads: Optional[List[Dict[str, Any]]] = None,
) -> CatalogItem:
    """Update a CatalogItem (and optional CardMetadata) inside a transaction."""
    with transaction.atomic():
        image_url = data.get("image_url")
        if image_url:
            validate_image_url(image_url)
        for attr, value in data.items():
            setattr(instance, attr, value)
        instance.save()

        if card_details_data is not None:
            card_metadata = getattr(instance, "card_metadata", None)
            if card_metadata:
                for attr, value in card_details_data.items():
                    setattr(card_metadata, attr, value)
                card_metadata.save()
            else:
                CardMetadata.objects.create(item=instance, **card_details_data)
        if media_payloads is not None:
            sync_item_media(item=instance, media_payloads=media_payloads)
        if variant_payloads is not None:
            sync_item_variants(item=instance, variants_payload=variant_payloads)
    return instance


__all__ = ["update_item"]

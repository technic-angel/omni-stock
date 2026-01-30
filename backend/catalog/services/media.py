"""Services for managing inventory media records."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.catalog.models import CatalogItem, CatalogMedia, CatalogMediaType

MAX_MEDIA_PER_ITEM = 6


@transaction.atomic
def sync_item_media(
    *,
    item: CatalogItem,
    media_payloads: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    Replace an item's media gallery with the provided payloads.
    Passing None leaves the gallery untouched; passing an empty list clears it.
    """
    if media_payloads is None:
        return

    if len(media_payloads) > MAX_MEDIA_PER_ITEM:
        raise ValueError(f"A maximum of {MAX_MEDIA_PER_ITEM} images are allowed per item.")

    CatalogMedia.objects.filter(item=item).delete()
    
    # Immediately clear image_url if payloads is empty
    if not media_payloads:
        item.image_url = None
        item.save(update_fields=["image_url"])
        return

    new_media: List[CatalogMedia] = []
    for idx, payload in enumerate(media_payloads):
        media_type = payload.get("media_type") or CatalogMediaType.GALLERY
        if media_type not in CatalogMediaType.values:
            raise ValueError(f"Unsupported media type {media_type}")
        new_media.append(
            CatalogMedia(
                item=item,
                media_type=media_type,
                url=payload["url"],
                sort_order=payload.get("sort_order", idx),
                is_primary=payload.get("is_primary", False),
                width=payload.get("width"),
                height=payload.get("height"),
                size_kb=payload.get("size_kb"),
                metadata=payload.get("metadata") or {},
            )
        )

    CatalogMedia.objects.bulk_create(new_media)

    first_media = CatalogMedia.objects.filter(item=item).order_by("sort_order", "id").first()
    has_primary = any(media.is_primary for media in new_media)
    
    if not has_primary and first_media:
        first_media.is_primary = True
        first_media.save(update_fields=["is_primary"])
    
    # Update CatalogItem.image_url to use the primary image URL
    primary_media = CatalogMedia.objects.filter(item=item, is_primary=True).first()
    if primary_media:
        item.image_url = primary_media.url
    else:
        # If all media cleared or no primary, clear image_url
        item.image_url = None
    
    item.save(update_fields=["image_url"])


__all__ = ["sync_item_media", "MAX_MEDIA_PER_ITEM"]

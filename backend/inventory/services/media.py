"""Services for managing inventory media records."""

from typing import Any, Dict, Iterable, List, Optional

from django.db import transaction

from backend.inventory.models import Collectible, InventoryMedia, InventoryMediaType

MAX_MEDIA_PER_ITEM = 6


@transaction.atomic
def sync_item_media(
    *,
    item: Collectible,
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

    InventoryMedia.objects.filter(item=item).delete()

    if not media_payloads:
        return

    new_media: List[InventoryMedia] = []
    for idx, payload in enumerate(media_payloads):
        media_type = payload.get("media_type") or InventoryMediaType.GALLERY
        if media_type not in InventoryMediaType.values:
            raise ValueError(f"Unsupported media type {media_type}")
        new_media.append(
            InventoryMedia(
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

    InventoryMedia.objects.bulk_create(new_media)

    has_primary = any(media.is_primary for media in new_media)
    if not has_primary:
        first_media = (
            InventoryMedia.objects.filter(item=item).order_by("sort_order", "id").first()
        )
        if first_media:
            first_media.is_primary = True
            first_media.save(update_fields=["is_primary"])


__all__ = ["sync_item_media", "MAX_MEDIA_PER_ITEM"]

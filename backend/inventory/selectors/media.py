"""Selectors for inventory media."""

from typing import Iterable

from backend.inventory.models import InventoryMedia


def list_media_for_items(item_ids: Iterable[int]):
    """Fetch media rows for the given item IDs ordered for hydration."""
    return (
        InventoryMedia.objects.filter(item_id__in=item_ids)
        .order_by("item_id", "sort_order", "id")
    )


__all__ = ["list_media_for_items"]

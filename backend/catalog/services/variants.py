"""Service helpers for managing catalog item variants."""

from typing import Any, Dict, List, Optional

from django.db import transaction

from backend.catalog.models import CatalogItem, CatalogVariant


@transaction.atomic
def sync_item_variants(
    *,
    item: CatalogItem,
    variants_payload: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    Replace an item's variants with the provided payloads.
    Passing None leaves variants untouched; passing an empty list clears them.
    """
    if variants_payload is None:
        return

    CatalogVariant.objects.filter(item=item).delete()

    if not variants_payload:
        return

    new_variants: List[CatalogVariant] = []
    for payload in variants_payload:
        new_variants.append(
            CatalogVariant(
                item=item,
                condition=payload.get("condition"),
                grade=payload.get("grade"),
                quantity=payload.get("quantity", 0),
                price_adjustment=payload.get("price_adjustment", 0),
            )
        )

    CatalogVariant.objects.bulk_create(new_variants)


__all__ = ["sync_item_variants"]

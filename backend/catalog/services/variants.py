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

    # Validate payloads to avoid DB integrity errors (unique_together)
    seen = set()
    new_variants: List[CatalogVariant] = []
    for payload in variants_payload:
        condition = payload.get("condition")
        grade = payload.get("grade")
        key = (condition or None, grade or None)
        if key in seen:
            raise ValueError(f"Duplicate variant for condition={condition} grade={grade}")
        seen.add(key)

        quantity = payload.get("quantity", 0) or 0
        try:
            quantity = int(quantity)
        except Exception:
            raise ValueError("Variant quantity must be an integer")

        price_adjustment = payload.get("price_adjustment", 0) or 0
        try:
            # store as Decimal via model field later; ensure numeric-ish value
            price_adjustment = float(price_adjustment)
        except Exception:
            raise ValueError("Variant price_adjustment must be numeric")

        new_variants.append(
            CatalogVariant(
                item=item,
                condition=condition,
                grade=grade,
                quantity=quantity,
                price_adjustment=price_adjustment,
            )
        )

    CatalogVariant.objects.bulk_create(new_variants)


__all__ = ["sync_item_variants"]

"""Services for managing the upcoming ProductImage gallery model."""

from typing import Any, Dict, List, Optional

from django.conf import settings
from django.db import transaction

from backend.inventory.models import Collectible, ProductImage

MAX_PRODUCT_IMAGES = 5


def _feature_enabled() -> bool:
    return getattr(settings, "ENABLE_VENDOR_REFACTOR", False)


@transaction.atomic
def sync_product_images(
    *,
    product: Collectible,
    image_payloads: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    Replace a product's image gallery.

    When the vendor refactor flag is disabled we bail early so callers can
    invoke this function safely without checking the flag themselves.
    """
    if image_payloads is None:
        return

    if not _feature_enabled():
        return

    if len(image_payloads) > MAX_PRODUCT_IMAGES:
        raise ValueError(f"A maximum of {MAX_PRODUCT_IMAGES} images are allowed per product.")

    ProductImage.objects.filter(product=product).delete()

    if not image_payloads:
        return

    new_rows: List[ProductImage] = []
    for idx, payload in enumerate(image_payloads):
        new_rows.append(
            ProductImage(
                product=product,
                url=payload["url"],
                sort_order=payload.get("sort_order", idx),
                is_primary=payload.get("is_primary", False),
                width=payload.get("width"),
                height=payload.get("height"),
                size_kb=payload.get("size_kb"),
                metadata=payload.get("metadata") or {},
            )
        )

    ProductImage.objects.bulk_create(new_rows)

    if not any(row.is_primary for row in new_rows):
        first = (
            ProductImage.objects.filter(product=product)
            .order_by("sort_order", "id")
            .first()
        )
        if first:
            first.is_primary = True
            first.save(update_fields=["is_primary"])


__all__ = ["sync_product_images", "MAX_PRODUCT_IMAGES"]

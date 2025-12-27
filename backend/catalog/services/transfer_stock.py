"""Service for moving collectibles between stores."""

from typing import Optional

from django.db import transaction

from backend.catalog.models import CatalogItem, StockLedger, Store


@transaction.atomic
def transfer_stock(
    *,
    item: CatalogItem,
    to_store: Store,
    performed_by=None,
    reason: Optional[str] = None,
) -> CatalogItem:
    """
    Move an item to another store and record a ledger entry.

    This currently transfers the entire collectible (since quantity is global).
    """
    from_store = item.store
    if from_store == to_store:
        return item

    item.store = to_store
    item.save(update_fields=["store"])

    StockLedger.objects.create(
        item=item,
        transaction_type="transfer",
        quantity_before=getattr(item, "quantity", 0) or 0,
        quantity_after=getattr(item, "quantity", 0) or 0,
        quantity_delta=0,
        reason=reason or "transfer",
        created_by=performed_by,
        metadata={
            "from_store_id": getattr(from_store, "id", None),
            "to_store_id": getattr(to_store, "id", None),
        },
    )
    return item


__all__ = ["transfer_stock"]

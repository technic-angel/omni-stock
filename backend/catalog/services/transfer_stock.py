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
        from_store=from_store,
        to_store=to_store,
        delta=item.quantity,
        reason=reason or "transfer",
        performed_by=performed_by,
    )
    return item


__all__ = ["transfer_stock"]

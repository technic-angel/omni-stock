"""Service for moving collectibles between stores."""

from typing import Optional

from django.db import transaction

from backend.inventory.models import Collectible, StockLedger, Store


@transaction.atomic
def transfer_stock(
    *,
    collectible: Collectible,
    to_store: Store,
    performed_by=None,
    reason: Optional[str] = None,
) -> Collectible:
    """
    Move an item to another store and record a ledger entry.

    This currently transfers the entire collectible (since quantity is global).
    """
    from_store = collectible.store
    if from_store == to_store:
        return collectible

    collectible.store = to_store
    collectible.save(update_fields=["store"])

    StockLedger.objects.create(
        collectible=collectible,
        from_store=from_store,
        to_store=to_store,
        delta=collectible.quantity,
        reason=reason or "transfer",
        performed_by=performed_by,
    )
    return collectible


__all__ = ["transfer_stock"]

"""Helpers for ensuring vendors always have at least one store."""

from __future__ import annotations

from backend.vendors.models import Store, Vendor

DEFAULT_STORE_NAME = "Default Store"


def ensure_default_store(vendor: Vendor) -> Store:
    """
    Return the first store for a vendor, creating a default one if missing.

    Vendors created before the refactor may not yet have an explicit store,
    but inventory records now require the relation to exist. This helper keeps
    the viewset/service logic simple by centralizing the auto-create behavior.
    """

    if vendor is None:
        raise ValueError("Cannot resolve a default store without a vendor.")

    store = Store.objects.filter(vendor=vendor).order_by("id").first()
    if store:
        return store
    return Store.objects.create(
        vendor=vendor,
        name=DEFAULT_STORE_NAME,
        metadata={"auto_created": True},
    )


__all__ = ["ensure_default_store", "DEFAULT_STORE_NAME"]

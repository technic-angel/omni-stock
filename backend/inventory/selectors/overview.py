"""Selector for computing inventory overview statistics."""

from typing import Any

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from backend.catalog.models import CatalogItem
from backend.core.permissions import resolve_user_vendor
from backend.org.models import Store


LOW_STOCK_THRESHOLD = 5


def get_inventory_overview(*, user) -> dict[str, Any]:
    """
    Compute aggregate inventory stats for the user's vendor.

    Returns:
        {
            "stats": {
                "totalSkus": int,
                "totalUnits": int,
                "lowStock": int,
                "pendingTransfers": int,
            },
            "stores": [
                {
                    "id": str,
                    "name": str,
                    "location": str | None,
                    "isDefault": bool,
                    "status": "active" | "paused",
                    "totalSkus": int,
                    "unitsOnHand": int,
                    "lowStock": int,
                },
                ...
            ]
        }
    """
    vendor = resolve_user_vendor(user)
    if vendor is None:
        return _empty_response()

    # Vendor-wide aggregates
    vendor_items = CatalogItem.objects.filter(vendor=vendor)
    totals = vendor_items.aggregate(
        total_skus=Count("id"),
        total_units=Coalesce(Sum("quantity"), 0),
        low_stock=Count("id", filter=Q(quantity__gt=0, quantity__lte=LOW_STOCK_THRESHOLD)),
    )

    # Per-store breakdown
    stores_qs = Store.objects.filter(vendor=vendor).order_by("name")
    stores_list = []
    for store in stores_qs:
        store_items = vendor_items.filter(store=store)
        store_agg = store_items.aggregate(
            total_skus=Count("id"),
            units_on_hand=Coalesce(Sum("quantity"), 0),
            low_stock=Count("id", filter=Q(quantity__gt=0, quantity__lte=LOW_STOCK_THRESHOLD)),
        )
        stores_list.append({
            "id": str(store.id),
            "name": store.name,
            "location": store.address or None,
            "isDefault": False,  # TODO: derive from VendorMember.active_store
            "status": "active" if store.is_active else "paused",
            "totalSkus": store_agg["total_skus"] or 0,
            "unitsOnHand": store_agg["units_on_hand"] or 0,
            "lowStock": store_agg["low_stock"] or 0,
        })

    return {
        "stats": {
            "totalSkus": totals["total_skus"] or 0,
            "totalUnits": totals["total_units"] or 0,
            "lowStock": totals["low_stock"] or 0,
            "pendingTransfers": 0,  # TODO: implement when StockTransfer model exists
        },
        "stores": stores_list,
    }


def _empty_response() -> dict[str, Any]:
    return {
        "stats": {
            "totalSkus": 0,
            "totalUnits": 0,
            "lowStock": 0,
            "pendingTransfers": 0,
        },
        "stores": [],
    }

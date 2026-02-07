"""Selector for computing inventory overview statistics."""

from typing import Any

from django.db.models import Count, Q, Sum, F, ExpressionWrapper, DecimalField
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
                "portfolioValue": Decimal,
                "acquisitionCost": Decimal,
                "pendingTransfers": int,
            },
            "categoryBreakdown": [
                {
                    "category": str,
                    "count": int,
                    "value": Decimal,
                },
                ...
            ],
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
        portfolio_value=Coalesce(
            Sum(ExpressionWrapper(F("quantity") * F("price"), output_field=DecimalField())),
            0,
            output_field=DecimalField(),
        ),
        acquisition_cost=Coalesce(
            Sum(ExpressionWrapper(F("quantity") * F("intake_price"), output_field=DecimalField())),
            0,
            output_field=DecimalField(),
        ),
    )

    # Category breakdown
    categories_qs = (
        vendor_items.values("category")
        .annotate(
            count=Count("id"),
            value=Coalesce(
                Sum(ExpressionWrapper(F("quantity") * F("price"), output_field=DecimalField())),
                0,
                output_field=DecimalField(),
            ),
        )
        .order_by("-value")
    )
    category_breakdown = [
        {
            "category": item["category"] or "Other",
            "count": item["count"],
            "value": item["value"],
        }
        for item in categories_qs
    ]

    # Top 5 items by value
    top_items_qs = (
        vendor_items.annotate(
            total_value=ExpressionWrapper(F("quantity") * F("price"), output_field=DecimalField())
        )
        .order_by("-total_value", "-price")[:5]
    )
    top_items = [
        {
            "id": str(item.id),
            "name": item.name,
            "sku": item.sku,
            "quantity": item.quantity,
            "price": item.price,
            "value": item.total_value,
            "image": item.image_url,
        }
        for item in top_items_qs
    ]

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
            "portfolioValue": totals["portfolio_value"] or 0,
            "acquisitionCost": totals["acquisition_cost"] or 0,
            "pendingTransfers": 0,  # TODO: implement when StockTransfer model exists
        },
        "categoryBreakdown": category_breakdown,
        "topItems": top_items,
        "stores": stores_list,
    }


def _empty_response() -> dict[str, Any]:
    return {
        "stats": {
            "totalSkus": 0,
            "totalUnits": 0,
            "lowStock": 0,
            "portfolioValue": 0,
            "acquisitionCost": 0,
            "pendingTransfers": 0,
        },
        "categoryBreakdown": [],
        "topItems": [],
        "stores": [],
    }


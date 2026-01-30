"""Selectors for listing inventory items scoped to the user."""

from typing import Any, Mapping

from django.db.models import Q, QuerySet

from backend.catalog.models import CatalogItem
from backend.core.permissions import resolve_user_vendor


def list_items(*, user, filters: Mapping[str, Any] | None = None) -> QuerySet:
    """Return catalog items scoped to the requesting user's vendor or user."""
    base_qs = CatalogItem.objects.select_related("vendor", "store", "card_metadata").prefetch_related(
        "media",
        "variants",
    )

    if user is None or not getattr(user, "is_authenticated", False):
        return base_qs.none()

    vendor = resolve_user_vendor(user)
    if vendor is not None:
        scoped = base_qs.filter(vendor=vendor)
    else:
        scoped = base_qs.filter(user=user)
    
    params = filters or {}

    store_id = params.get("store") or params.get("store_id")
    if store_id:
        scoped = scoped.filter(store_id=store_id)

    vendor_id = params.get("vendor") or params.get("vendor_id")
    if vendor_id:
        scoped = scoped.filter(vendor_id=vendor_id)

    search = (params.get("search") or params.get("q") or "").strip()
    if search:
        scoped = scoped.filter(Q(search_text__icontains=search) | Q(sku__iexact=search))

    category = params.get("category")
    if category:
        scoped = scoped.filter(category__exact=category)

    status = params.get("status")
    if status:
        scoped = scoped.filter(status__exact=status)
    
    language = params.get("language")
    if language:
        scoped = scoped.filter(card_metadata__language__iexact=language)
    
    market_region = params.get("market_region")
    if market_region:
        scoped = scoped.filter(card_metadata__market_region__iexact=market_region)


    sort_by = params.get("sort_by", "created_at")
    sort_order = params.get("sort_order", "desc")
    valid_sort_fields = {"name", "created_at", "updated_at", "price"}
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"
    prefix = "-" if sort_order in {"desc", "descending"} else ""
    scoped = scoped.order_by(f"{prefix}{sort_by}")

    return scoped


__all__ = ["list_items"]

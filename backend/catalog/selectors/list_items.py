"""Selectors for listing inventory items scoped to the user."""

from typing import Any, Mapping

from django.db.models import QuerySet

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
    language = params.get("language")
    if language:
        scoped = scoped.filter(card_metadata__language__iexact=language)
    market_region = params.get("market_region")
    if market_region:
        scoped = scoped.filter(card_metadata__market_region__iexact=market_region)

    return scoped.order_by("name")


__all__ = ["list_items"]

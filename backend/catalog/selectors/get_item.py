"""Selectors for retrieving a single inventory item scoped to the user."""

from typing import Any, Dict

from django.core.exceptions import ObjectDoesNotExist

from backend.catalog.models import CatalogItem
from backend.catalog.selectors.list_items import list_items


def get_item(*, user, item_id: Any, filters: Dict[str, Any] | None = None) -> CatalogItem:
    """Return a single catalog item scoped to the provided user."""
    queryset = list_items(user=user, filters=filters)
    try:
        return queryset.get(pk=item_id)
    except ObjectDoesNotExist as exc:
        raise CatalogItem.DoesNotExist(str(exc)) from exc


__all__ = ["get_item"]

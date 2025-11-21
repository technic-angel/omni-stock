"""Selectors for retrieving a single inventory item scoped to the user."""

from typing import Any, Dict

from django.core.exceptions import ObjectDoesNotExist

from backend.inventory.models import Collectible
from backend.inventory.selectors.list_items import list_items


def get_item(*, user, collectible_id: Any, filters: Dict[str, Any] | None = None) -> Collectible:
    """Return a single collectible scoped to the provided user."""
    queryset = list_items(user=user, filters=filters)
    try:
        return queryset.get(pk=collectible_id)
    except ObjectDoesNotExist as exc:
        raise Collectible.DoesNotExist(str(exc)) from exc


__all__ = ["get_item"]

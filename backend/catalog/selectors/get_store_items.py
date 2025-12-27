"""Store-scoped inventory listing helper."""

from typing import Any, Mapping

from django.db.models import QuerySet

from backend.catalog.selectors.list_items import list_items


def get_store_items(*, user, store_id: int, filters: Mapping[str, Any] | None = None) -> QuerySet:
    """Force the store filter before delegating to the shared list_items selector."""
    params = dict(filters or {})
    params["store"] = store_id
    return list_items(user=user, filters=params)


__all__ = ["get_store_items"]

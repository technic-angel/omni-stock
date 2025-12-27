"""Free-text inventory search helper."""

from typing import Any, Mapping

from django.db.models import QuerySet

from backend.catalog.models import CatalogItem
from backend.catalog.selectors.list_items import list_items


def search_items(
    *,
    user,
    query: str,
    filters: Mapping[str, Any] | None = None,
    min_length: int = 2,
) -> QuerySet:
    """Return catalog items matching the search query (with min-length guard)."""
    query = (query or "").strip()
    if len(query) < min_length:
        return CatalogItem.objects.none()
    params = dict(filters or {})
    params["search"] = query
    return list_items(user=user, filters=params)


__all__ = ["search_items"]

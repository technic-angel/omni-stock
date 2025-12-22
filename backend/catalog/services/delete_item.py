"""Service for deleting inventory items."""

from backend.catalog.models import CatalogItem


def delete_item(*, instance: CatalogItem) -> None:
    """Delete the provided CatalogItem."""
    instance.delete()


__all__ = ["delete_item"]

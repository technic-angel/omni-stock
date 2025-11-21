"""Service for deleting inventory items."""

from backend.inventory.models import Collectible


def delete_item(*, instance: Collectible) -> None:
    """Delete the provided Collectible."""
    instance.delete()


__all__ = ["delete_item"]

"""Service for updating vendors."""

from typing import Any, Dict

from backend.vendors.models import Vendor


def update_vendor(*, instance: Vendor, data: Dict[str, Any]) -> Vendor:
    """Update the vendor instance with provided fields."""
    for attr, value in data.items():
        setattr(instance, attr, value)
    instance.save()
    return instance


__all__ = ["update_vendor"]

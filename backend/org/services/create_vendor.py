"""Service for creating vendors."""

from typing import Any, Dict

from backend.org.models import Vendor


def create_vendor(
    *,
    name: str,
    description: str | None = None,
    contact_info: str | None = None,
    is_active: bool = True,
    extra_fields: Dict[str, Any] | None = None,
) -> Vendor:
    """Create a vendor with basic metadata."""
    payload: Dict[str, Any] = {
        "name": name,
        "description": description,
        "contact_info": contact_info,
        "is_active": is_active,
    }
    if extra_fields:
        payload.update(extra_fields)
    return Vendor.objects.create(**payload)


__all__ = ["create_vendor"]

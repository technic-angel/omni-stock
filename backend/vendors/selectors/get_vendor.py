"""Selector for retrieving a single vendor."""

from typing import Any

from django.core.exceptions import ObjectDoesNotExist

from backend.vendors.models import Vendor
from backend.vendors.selectors.list_vendors import list_vendors


def get_vendor(*, user, vendor_id: Any) -> Vendor | None:
    """Return the vendor if accessible to the user, else None."""
    queryset = list_vendors(user=user)
    try:
        return queryset.get(pk=vendor_id)
    except ObjectDoesNotExist:
        return None


__all__ = ["get_vendor"]

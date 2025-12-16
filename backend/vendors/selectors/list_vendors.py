"""Selector for listing vendors."""

from django.db.models import QuerySet

from backend.core.permissions import resolve_user_vendor
from backend.vendors.models import Vendor


def list_vendors(*, user) -> QuerySet:
    """Return vendors scoped to the requesting user's vendor context, if any."""
    base_qs = Vendor.objects.all()
    if user is None or not getattr(user, "is_authenticated", False):
        return base_qs.none()

    vendor = resolve_user_vendor(user)
    if vendor is not None:
        return base_qs.filter(pk=vendor.pk)

    return base_qs


__all__ = ["list_vendors"]

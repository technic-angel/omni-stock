"""Selector for listing vendors."""

from django.db.models import QuerySet

from backend.core.permissions import resolve_user_vendor
from backend.org.models import Vendor, VendorMember


def list_vendors(*, user) -> QuerySet:
    """Return vendors the user can access."""
    if user is None or not getattr(user, "is_authenticated", False):
        return Vendor.objects.none()

    membership_vendor_ids = list(
        VendorMember.objects.filter(user=user, is_active=True).values_list("vendor_id", flat=True)
    )
    if membership_vendor_ids:
        return Vendor.objects.filter(pk__in=membership_vendor_ids).order_by("name")

    vendor = resolve_user_vendor(user)
    if vendor is not None:
        return Vendor.objects.filter(pk=vendor.pk)

    return Vendor.objects.none()


__all__ = ["list_vendors"]

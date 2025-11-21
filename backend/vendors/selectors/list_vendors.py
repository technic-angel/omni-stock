"""Selector for listing vendors."""

from django.db.models import QuerySet

from backend.vendors.models import Vendor


def list_vendors(*, user) -> QuerySet:
    """Return vendors scoped to the requesting user's profile vendor, if any."""
    base_qs = Vendor.objects.all()
    if user is None or not getattr(user, "is_authenticated", False):
        return base_qs.none()

    profile = getattr(user, "profile", None)
    if profile is not None and getattr(profile, "vendor", None) is not None:
        return base_qs.filter(pk=profile.vendor.pk)

    return base_qs


__all__ = ["list_vendors"]

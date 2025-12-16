"""Core permission helpers."""

from django.conf import settings
from rest_framework.permissions import BasePermission


def resolve_user_vendor(user):
    """Return the vendor associated with the user's profile or membership."""
    if not user:
        return None
    if getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
        membership = (
            getattr(user, "vendor_memberships", None)
            and user.vendor_memberships.filter(is_active=True).select_related("vendor").first()
        )
        if membership and membership.vendor:
            return membership.vendor
    profile = getattr(user, "profile", None)
    return getattr(profile, "vendor", None) if profile else None


class VendorScopedPermission(BasePermission):
    """
    Permission ensuring users may only interact with inventory tied to their vendor.

    A user with a vendor profile is limited to that vendor's objects. Users without
    a vendor profile cannot interact with vendor-specific data unless otherwise allowed.
    """

    message = "You do not have permission to access this inventory item."

    def has_object_permission(self, request, view, obj):
        vendor = resolve_user_vendor(request.user)
        if vendor is None:
            # Allow users without a vendor to interact only with their own objects.
            return getattr(obj, "user", None) == request.user
        return getattr(obj, "vendor", None) == vendor


__all__ = ["VendorScopedPermission", "resolve_user_vendor"]

"""Core permission helpers."""

from django.conf import settings
from rest_framework.permissions import BasePermission

from backend.vendors.services.store_defaults import ensure_default_store


def resolve_user_vendor(user):
    """Return the vendor associated with the user's profile or membership."""
    if not user:
        return None
    profile = getattr(user, "profile", None)
    preferred_vendor = getattr(profile, "vendor", None) if profile else None
    if getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
        memberships = getattr(user, "vendor_memberships", None)
        if memberships is None:
            return preferred_vendor
        qs = memberships.filter(is_active=True).select_related("vendor")
        if preferred_vendor:
            membership = qs.filter(vendor=preferred_vendor).first()
            if membership and membership.vendor:
                return membership.vendor
        membership = qs.first()
        if membership and membership.vendor:
            return membership.vendor
    return preferred_vendor


def resolve_user_store(user):
    """Resolve the store selected by the current user."""
    vendor = resolve_user_vendor(user)
    if vendor is None or not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
        return None
    memberships = getattr(user, "vendor_memberships", None)
    if memberships is None:
        return ensure_default_store(vendor)
    membership = (
        memberships.filter(is_active=True, vendor=vendor)
        .select_related("active_store")
        .first()
    )
    if membership and membership.active_store and membership.active_store.vendor_id == vendor.id:
        return membership.active_store
    return ensure_default_store(vendor)


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


__all__ = ["VendorScopedPermission", "resolve_user_vendor", "resolve_user_store"]

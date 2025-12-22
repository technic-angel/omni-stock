"""Core permission helpers."""

from django.conf import settings
from rest_framework.permissions import BasePermission

from backend.org.services.store_defaults import ensure_default_store


def _get_active_membership(user):
    memberships = getattr(user, "vendor_memberships", None)
    if memberships is None:
        return None
    qs = memberships.filter(is_active=True).select_related("vendor", "active_store")
    membership = qs.filter(is_primary=True).first()
    if membership:
        return membership
    return qs.first()


def resolve_user_vendor(user):
    """Return the vendor associated with the user's active membership."""
    if not user:
        return None
    membership = _get_active_membership(user)
    if membership and membership.vendor:
        return membership.vendor
    return None


def resolve_user_store(user):
    """Resolve the store selected by the current user."""
    if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
        return None
    membership = _get_active_membership(user)
    vendor = membership.vendor if membership else None
    if vendor is None:
        return None
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

"""Permissions and helpers for vendor/member/store APIs."""

from django.conf import settings
from rest_framework.permissions import BasePermission

from backend.core.permissions import resolve_user_vendor
from backend.vendors.models import Store, StoreAccess, VendorMemberRole


def get_active_membership(user, vendor=None):
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    qs = getattr(user, "vendor_memberships", None)
    if qs is None:
        return None
    memberships = qs.filter(is_active=True)
    if vendor is not None:
        memberships = memberships.filter(vendor=vendor)
    return memberships.select_related("vendor").first()


def user_has_store_access(user, store: Store) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    membership = get_active_membership(user, vendor=store.vendor)
    if membership is None:
        return False
    if membership.role in VendorMemberRole.admin_roles():
        return True
    return StoreAccess.objects.filter(store=store, member=membership, is_active=True).exists()


class IsVendorAdmin(BasePermission):
    """Allow access only when the user is an admin/owner of their vendor."""

    def has_permission(self, request, view):
        vendor = resolve_user_vendor(request.user)
        if vendor is None:
            return False
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            return True
        membership = get_active_membership(request.user, vendor=vendor)
        if membership is None:
            profile = getattr(request.user, "profile", None)
            return getattr(profile, "vendor_id", None) == getattr(vendor, "id", None)
        return membership.role in VendorMemberRole.admin_roles()


class HasStoreAccess(BasePermission):
    """Ensure a user has access to a store when the refactor flag is on."""

    message = "You do not have access to that store."

    def has_permission(self, request, view):
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            return True
        store_id = (request.data or {}).get("store")
        if not store_id:
            return True
        try:
            store = Store.objects.get(pk=store_id)
        except Store.DoesNotExist:
            return False
        return user_has_store_access(request.user, store)

    def has_object_permission(self, request, view, obj):
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            return True
        store = getattr(obj, "store", None)
        if store is None:
            return True
        return user_has_store_access(request.user, store)


__all__ = ["IsVendorAdmin", "HasStoreAccess", "get_active_membership", "user_has_store_access"]

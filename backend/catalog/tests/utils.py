from backend.catalog.tests.factories import VendorFactory
from backend.org.models import Store, StoreType, VendorMember, VendorMemberRole
from backend.org.services.memberships import set_active_vendor


def ensure_vendor_admin(user, vendor=None, store=None):
    """
    Ensure the given user has an active admin membership for a vendor/store combo.

    Returns a tuple of (vendor, store).
    """
    if store is not None and vendor is None:
        vendor = store.vendor

    vendor = vendor or VendorFactory.create()

    if store is not None:
        if store.vendor_id != vendor.id:
            raise ValueError("Store must belong to the provided vendor.")
    else:
        store = vendor.stores.first()
        if store is None:
            store = Store.objects.create(
                vendor=vendor,
                name=f"{vendor.name} Flagship",
                type=StoreType.RETAIL,
            )

    membership, _ = VendorMember.objects.get_or_create(
        user=user,
        vendor=vendor,
        defaults={
            "role": VendorMemberRole.OWNER,
            "invite_status": VendorMember.InviteStatus.ACCEPTED,
            "is_active": True,
        },
    )
    membership.role = VendorMemberRole.OWNER
    membership.is_active = True
    membership.invite_status = VendorMember.InviteStatus.ACCEPTED
    membership.active_store = store
    membership.is_primary = True
    membership.save(update_fields=["role", "is_active", "invite_status", "active_store", "is_primary"])
    VendorMember.objects.filter(user=user).exclude(pk=membership.pk).update(is_primary=False)
    set_active_vendor(user=user, vendor=vendor)

    return vendor, store


__all__ = ["ensure_vendor_admin"]

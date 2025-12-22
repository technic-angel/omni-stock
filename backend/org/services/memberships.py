"""Services for managing vendor memberships."""

from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from backend.org.models import (
    Store,
    StoreAccess,
    StoreAccessRole,
    Vendor,
    VendorMember,
    VendorMemberRole,
)
from backend.org.services.store_defaults import ensure_default_store

User = get_user_model()


@transaction.atomic
def invite_member(*, vendor: Vendor, email: str, role: str = VendorMemberRole.MEMBER, invited_by: Optional[User] = None) -> VendorMember:
    user, _ = User.objects.get_or_create(email=email, defaults={"username": email.split("@")[0]})
    defaults = {
        "role": role,
        "invited_by": invited_by,
        "invite_status": VendorMember.InviteStatus.PENDING,
        "is_active": False,
        "invited_at": timezone.now(),
        "responded_at": None,
        "revoked_at": None,
        "active_store": None,
    }
    member, created = VendorMember.objects.get_or_create(
        vendor=vendor,
        user=user,
        defaults=defaults,
    )
    if not created:
        for field, value in defaults.items():
            setattr(member, field, value)
        member.save(update_fields=list(defaults.keys()))
    return member


@transaction.atomic
def update_membership_role(*, member: VendorMember, role: str) -> VendorMember:
    member.role = role
    member.save(update_fields=["role"])
    return member


@transaction.atomic
def deactivate_membership(*, member: VendorMember) -> None:
    member.is_active = False
    member.active_store = None
    member.invite_status = VendorMember.InviteStatus.REVOKED
    member.revoked_at = timezone.now()
    member.save(update_fields=["is_active", "active_store", "invite_status", "revoked_at"])


@transaction.atomic
def accept_invite(*, member: VendorMember) -> VendorMember:
    member.invite_status = VendorMember.InviteStatus.ACCEPTED
    member.is_active = True
    member.responded_at = timezone.now()
    member.revoked_at = None
    member.save(update_fields=["invite_status", "is_active", "responded_at", "revoked_at"])
    return member


@transaction.atomic
def decline_invite(*, member: VendorMember) -> VendorMember:
    member.invite_status = VendorMember.InviteStatus.DECLINED
    member.is_active = False
    member.responded_at = timezone.now()
    member.save(update_fields=["invite_status", "is_active", "responded_at"])
    return member


@transaction.atomic
def set_active_vendor(*, user: User, vendor: Vendor) -> Vendor:
    membership = (
        VendorMember.objects.filter(user=user, vendor=vendor, is_active=True)
        .select_related("active_store")
        .first()
    )
    if membership is None:
        raise ValueError("User is not an active member of this vendor.")

    VendorMember.objects.filter(user=user).exclude(pk=membership.pk).update(is_primary=False)

    updated_fields = []
    if not membership.is_primary:
        membership.is_primary = True
        updated_fields.append("is_primary")
    if membership.active_store is None:
        membership.active_store = ensure_default_store(vendor)
        updated_fields.append("active_store")
    if updated_fields:
        membership.save(update_fields=updated_fields)
    return vendor


@transaction.atomic
def set_active_store(*, member: VendorMember, store: Store) -> VendorMember:
    if store.vendor_id != member.vendor_id:
        raise ValueError("Store must belong to the member's vendor.")
    if member.active_store_id == store.id:
        return member
    member.active_store = store
    member.save(update_fields=["active_store"])
    return member


@transaction.atomic
def ensure_owner_membership(*, vendor: Vendor, user: User) -> VendorMember:
    """
    Guarantee that a user has an active OWNER membership for a vendor.

    Used when bootstrapping a newly created vendor so the creator can
    immediately administer stores, members, etc.
    """

    if vendor is None or user is None:
        raise ValueError("Both vendor and user are required to ensure ownership.")

    store = ensure_default_store(vendor)
    defaults = {
        "role": VendorMemberRole.OWNER,
        "invite_status": VendorMember.InviteStatus.ACCEPTED,
        "is_active": True,
        "active_store": store,
    }
    member, created = VendorMember.objects.get_or_create(
        vendor=vendor,
        user=user,
        defaults=defaults,
    )
    if not created:
        dirty_fields = []
        for field, value in defaults.items():
            if getattr(member, field) != value:
                setattr(member, field, value)
                dirty_fields.append(field)
        if dirty_fields:
            member.save(update_fields=dirty_fields)

    set_active_vendor(user=user, vendor=vendor)
    if member.active_store_id != store.id:
        set_active_store(member=member, store=store)

    return member


@transaction.atomic
def create_store(*, vendor: Vendor, name: str, **kwargs) -> Store:
    return Store.objects.create(vendor=vendor, name=name, **kwargs)


@transaction.atomic
def update_store(*, store: Store, **kwargs) -> Store:
    for field, value in kwargs.items():
        setattr(store, field, value)
    store.save()
    return store


@transaction.atomic
def assign_store_access(*, store: Store, member: VendorMember, role: str = StoreAccessRole.SALES) -> StoreAccess:
    access, _ = StoreAccess.objects.update_or_create(
        store=store,
        member=member,
        defaults={"role": role, "is_active": True},
    )
    return access


@transaction.atomic
def remove_store_access(*, store: Store, member: VendorMember) -> None:
    StoreAccess.objects.filter(store=store, member=member).delete()


__all__ = [
    "invite_member",
    "update_membership_role",
    "deactivate_membership",
    "accept_invite",
    "decline_invite",
    "set_active_vendor",
    "set_active_store",
    "create_store",
    "update_store",
    "assign_store_access",
    "remove_store_access",
    "ensure_owner_membership",
]

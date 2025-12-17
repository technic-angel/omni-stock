"""Services for managing vendor memberships."""

from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from backend.vendors.models import (
    Store,
    StoreAccess,
    StoreAccessRole,
    Vendor,
    VendorMember,
    VendorMemberRole,
)

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
    member.invite_status = VendorMember.InviteStatus.REVOKED
    member.revoked_at = timezone.now()
    member.save(update_fields=["is_active", "invite_status", "revoked_at"])


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
    "create_store",
    "update_store",
    "assign_store_access",
    "remove_store_access",
]

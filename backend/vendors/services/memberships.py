"""Services for managing vendor memberships."""

from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction

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
    member, created = VendorMember.objects.get_or_create(
        vendor=vendor,
        user=user,
        defaults={"role": role, "invited_by": invited_by},
    )
    if not created:
        member.role = role
        member.invited_by = invited_by
        member.save(update_fields=["role", "invited_by"])
    return member


@transaction.atomic
def update_membership_role(*, member: VendorMember, role: str) -> VendorMember:
    member.role = role
    member.save(update_fields=["role"])
    return member


@transaction.atomic
def deactivate_membership(*, member: VendorMember) -> None:
    member.is_active = False
    member.save(update_fields=["is_active"])


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
    "create_store",
    "update_store",
    "assign_store_access",
    "remove_store_access",
]

import pytest

from backend.catalog.tests.factories import UserFactory, VendorFactory
from backend.org.models import StoreAccessRole, VendorMemberRole
from backend.org.services.memberships import (
    assign_store_access,
    create_store,
    deactivate_membership,
    invite_member,
    remove_store_access,
    update_membership_role,
    update_store,
)


@pytest.mark.django_db
def test_invite_member_creates_vendor_member():
    vendor = VendorFactory.create()
    member = invite_member(vendor=vendor, email="demo@example.com", role=VendorMemberRole.ADMIN)

    assert member.vendor == vendor
    assert member.role == VendorMemberRole.ADMIN
@pytest.mark.django_db
def test_invite_member_updates_existing_membership():
    vendor = VendorFactory.create()
    inviter = UserFactory.create()
    invite_member(vendor=vendor, email="demo@example.com")

    updated = invite_member(
        vendor=vendor,
        email="demo@example.com",
        role=VendorMemberRole.MANAGER,
        invited_by=inviter,
    )
    updated.refresh_from_db()
    assert updated.role == VendorMemberRole.MANAGER
    assert updated.invited_by == inviter


@pytest.mark.django_db
def test_update_membership_role_changes_role():
    vendor = VendorFactory.create()
    member = invite_member(vendor=vendor, email="demo@example.com")

    update_membership_role(member=member, role=VendorMemberRole.MANAGER)
    member.refresh_from_db()
    assert member.role == VendorMemberRole.MANAGER


@pytest.mark.django_db
def test_deactivate_membership_marks_inactive():
    vendor = VendorFactory.create()
    member = invite_member(vendor=vendor, email="demo@example.com")

    deactivate_membership(member=member)
    member.refresh_from_db()
    assert member.is_active is False


@pytest.mark.django_db
def test_store_services_create_and_assign_access():
    vendor = VendorFactory.create()
    member = invite_member(vendor=vendor, email="demo@example.com")

    store = create_store(vendor=vendor, name="HQ")
    access = assign_store_access(store=store, member=member, role=StoreAccessRole.MANAGER)

    assert access.role == StoreAccessRole.MANAGER

    remove_store_access(store=store, member=member)
    assert store.access.count() == 0


@pytest.mark.django_db
def test_update_store_modifies_metadata():
    vendor = VendorFactory.create()
    store = create_store(vendor=vendor, name="HQ", metadata={"region": "east"})

    update_store(store=store, name="HQ Updated", metadata={"region": "west"})
    store.refresh_from_db()
    assert store.name == "HQ Updated"
    assert store.metadata["region"] == "west"

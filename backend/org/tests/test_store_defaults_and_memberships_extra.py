import pytest

from backend.catalog.tests.factories import UserFactory, VendorFactory
from backend.org.models import VendorMemberRole
from backend.org.services.memberships import (
    ensure_owner_membership,
    invite_member,
    set_active_store,
    set_active_vendor,
)
from backend.org.services.store_defaults import DEFAULT_STORE_NAME, ensure_default_store


@pytest.mark.django_db
def test_ensure_default_store_creates_and_returns_existing():
    vendor = VendorFactory.create()
    store = ensure_default_store(vendor)
    assert store.vendor == vendor
    assert store.name == DEFAULT_STORE_NAME
    assert store.metadata.get("auto_created") is True

    # calling again should return the same store (no duplicate created)
    store2 = ensure_default_store(vendor)
    assert store.id == store2.id


def test_ensure_default_store_raises_on_none():
    with pytest.raises(ValueError):
        ensure_default_store(None)


@pytest.mark.django_db
def test_set_active_vendor_raises_for_non_member():
    vendor = VendorFactory.create()
    user = UserFactory.create()

    with pytest.raises(ValueError):
        set_active_vendor(user=user, vendor=vendor)


@pytest.mark.django_db
def test_set_active_store_raises_on_vendor_mismatch():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()
    # invite a member for vendor1
    member = invite_member(vendor=vendor1, email="mismatch@example.com")
    # create a store for vendor2
    from backend.org.models import Store

    store = Store.objects.create(vendor=vendor2, name="Other")

    with pytest.raises(ValueError):
        set_active_store(member=member, store=store)


@pytest.mark.django_db
def test_ensure_owner_membership_creates_owner_and_sets_active():
    vendor = VendorFactory.create()
    user = UserFactory.create()

    member = ensure_owner_membership(vendor=vendor, user=user)

    assert member.role == VendorMemberRole.OWNER
    assert member.is_active is True
    assert member.active_store is not None
    # set_active_vendor should have been called and set this member primary
    member.refresh_from_db()
    assert member.is_primary is True

import pytest

from backend.catalog.tests.factories import VendorFactory
from backend.org.models import StoreAccessRole
from backend.org.services.memberships import (
    assign_store_access,
    create_store,
    invite_member,
    remove_store_access,
)


@pytest.mark.django_db
def test_assign_store_access_creates_record():
    vendor = VendorFactory.create()
    member = invite_member(vendor=vendor, email="demo@example.com")
    store = create_store(vendor=vendor, name="HQ")

    access = assign_store_access(store=store, member=member, role=StoreAccessRole.MANAGER)
    assert access.role == StoreAccessRole.MANAGER

    remove_store_access(store=store, member=member)
    assert not store.access.exists()

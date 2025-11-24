import pytest

from backend.vendors.services.create_vendor import create_vendor
from backend.vendors.services.update_vendor import update_vendor


@pytest.mark.django_db
def test_update_vendor_changes_mutable_fields():
    vendor = create_vendor(name="Original Name")

    updated = update_vendor(instance=vendor, data={"name": "Updated Name", "is_active": False})

    assert updated.pk == vendor.pk
    assert updated.name == "Updated Name"
    assert updated.is_active is False

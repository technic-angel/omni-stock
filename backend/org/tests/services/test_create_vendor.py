import pytest

from backend.org.models import Vendor
from backend.org.services.create_vendor import create_vendor


@pytest.mark.django_db
def test_create_vendor_generates_slug():
    vendor = create_vendor(name="Test Vendor", description="Cards")

    assert isinstance(vendor, Vendor)
    assert vendor.slug.startswith("test-vendor")
    assert vendor.description == "Cards"

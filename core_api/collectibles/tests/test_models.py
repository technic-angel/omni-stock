import pytest

from collectibles.models import Vendor, Collectible, CardDetails
from collectibles.tests.factories import VendorFactory, CollectibleFactory, CardDetailsFactory
from types import SimpleNamespace


@pytest.mark.django_db
def test_vendor_slug_generation():
    v1 = VendorFactory.create(name="Acme Cards")
    assert v1.slug and v1.slug.startswith("acme-cards")

    v2 = VendorFactory.create(name="Acme Cards")
    # ensure uniqueness
    assert v2.slug != v1.slug


@pytest.mark.django_db
def test_carddetails_external_ids_helper():
    c = CollectibleFactory.create(name="Test Card", sku="TEST-001")
    cd = CardDetailsFactory.create(collectible=c)

    # initially empty
    assert cd.get_external_ids() == {}

    cd.set_external_ids({"foo": "bar"})
    cd.save()
    assert cd.get_external_ids() == {"foo": "bar"}


@pytest.mark.django_db
def test_carddetails_str_with_sku():
    c = CollectibleFactory.create(name="Str Card", sku="STR-001")
    cd = CardDetailsFactory.create(collectible=c)
    assert str(cd) == "CardDetails for STR-001"


@pytest.mark.django_db
def test_carddetails_str_unsaved():
    # unsaved CardDetails without a PK or related collectible should show a clear marker
    cd = CardDetails()
    assert str(cd) == "CardDetails (unsaved)"


@pytest.mark.django_db
def test_carddetails_str_saved_collectible_missing_sku():
    # Saved CardDetails where the related Collectible at runtime has no `sku`
    # attribute (e.g., defensive runtime case) should fall back to the CardDetails PK.
    c = CollectibleFactory.create(name="NoSKU Card", sku="NSKU-001")
    cd = CardDetailsFactory.create(collectible=c)

    # Simulate a runtime collectible object lacking a sku attribute by
    # replacing the related object in-memory with a simple object that
    # does not expose `sku`.
    cd.collectible = SimpleNamespace()

    # Ensure the instance falls back to the CardDetails PK
    assert str(cd) == f"CardDetails for {cd.pk}"

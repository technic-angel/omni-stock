import pytest

from collectibles.models import Vendor, Collectible, CardDetails


@pytest.mark.django_db
def test_vendor_slug_generation():
    v1 = Vendor.objects.create(name="Acme Cards")
    assert v1.slug and v1.slug.startswith("acme-cards")

    v2 = Vendor.objects.create(name="Acme Cards")
    # ensure uniqueness
    assert v2.slug != v1.slug


@pytest.mark.django_db
def test_carddetails_external_ids_helper():
    c = Collectible.objects.create(name="Test Card", sku="TEST-001", quantity=1)
    cd = CardDetails.objects.create(collectible=c)

    # initially empty
    assert cd.get_external_ids() == {}

    cd.set_external_ids({"foo": "bar"})
    cd.save()
    assert cd.get_external_ids() == {"foo": "bar"}

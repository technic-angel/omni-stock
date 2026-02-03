import pytest
from rest_framework.test import APIClient

from backend.catalog.models import CatalogItem, CatalogVariant
from backend.catalog.tests.factories import UserFactory, VendorFactory
from backend.catalog.tests.utils import ensure_vendor_admin


@pytest.mark.django_db
def test_collectible_create_rejects_duplicate_variant_condition_grade():
    client = APIClient()

    user = UserFactory.create(username="variants_dup_user")
    vendor = VendorFactory.create()
    _, store = ensure_vendor_admin(user, vendor=vendor)
    client.force_authenticate(user=user)

    sku = "VAR-DUP-1"
    payload = {
        "name": "Variant Duplicate",
        "sku": sku,
        "quantity": 2,
        "store": store.id,
        "variant_payloads": [
            {"condition": "Raw", "grade": "A", "quantity": 1},
            {"condition": "Raw", "grade": "A", "quantity": 1},
        ],
    }

    resp = client.post("/api/v1/catalog/items/", payload, format="json")
    assert resp.status_code == 400
    # Ensure no item or variants were created
    assert not CatalogItem.objects.filter(sku=sku).exists()
    assert not CatalogVariant.objects.filter(item__sku=sku).exists()


@pytest.mark.django_db
def test_collectible_create_rejects_invalid_variant_types():
    client = APIClient()

    user = UserFactory.create(username="variants_type_user")
    vendor = VendorFactory.create()
    _, store = ensure_vendor_admin(user, vendor=vendor)
    client.force_authenticate(user=user)

    sku = "VAR-TYPE-1"
    payload = {
        "name": "Variant Bad Types",
        "sku": sku,
        "quantity": 1,
        "store": store.id,
        "variant_payloads": [
            {"condition": "PSA 10", "quantity": "two"},
            {"condition": "Raw", "quantity": 1, "price_adjustment": "not-a-number"},
        ],
    }

    resp = client.post("/api/v1/catalog/items/", payload, format="json")
    assert resp.status_code == 400
    assert not CatalogItem.objects.filter(sku=sku).exists()
    assert not CatalogVariant.objects.filter(item__sku=sku).exists()

import pytest
from rest_framework.test import APIClient

from backend.catalog.tests.factories import StoreFactory, UserFactory, VendorFactory
from backend.catalog.tests.utils import ensure_vendor_admin


@pytest.mark.django_db
def test_create_card_details_with_invalid_date_format():
    """Invalid nested `release_date` should produce a 400 response."""
    client = APIClient()
    vendor = VendorFactory.create()
    user = UserFactory.create()
    _, store = ensure_vendor_admin(user, vendor)
    client.force_authenticate(user=user)

    payload = {
        "name": "Bad Date",
        "sku": "BAD-001",
        "quantity": 1,
        "store": store.id,
        "card_details": {"release_date": "not-a-date"},
    }

    resp = client.post("/api/v1/catalog/items/", payload, format='json')
    assert resp.status_code == 400
    body = resp.json()
    # error is reported under the nested `card_details` key
    assert "card_details" in body and "release_date" in body["card_details"]


@pytest.mark.django_db
def test_unauthenticated_user_cannot_create_collectible_with_card_details():
    """Ensure unauthenticated requests are rejected (401)."""
    client = APIClient()
    payload = {
        "name": "No Auth",
        "sku": "NOAUTH-1",
        "quantity": 1,
        "card_details": {"language": "French"},
    }
    resp = client.post("/api/v1/catalog/items/", payload, format='json')
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_user_without_vendor_cannot_create_collectible():
    """Users must join a vendor before creating inventory so a store can be assigned."""
    client = APIClient()
    user = UserFactory.create()
    client.force_authenticate(user=user)

    other_vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=other_vendor)
    payload = {"name": "User Owned", "sku": "USER-1", "quantity": 1, "store": store.id}
    resp = client.post("/api/v1/catalog/items/", payload, format='json')
    assert resp.status_code == 403
    detail = resp.json().get("detail", "").lower()
    assert "store" in detail or "vendor" in detail

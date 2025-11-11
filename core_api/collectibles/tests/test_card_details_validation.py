import pytest

from rest_framework.test import APIClient


@pytest.mark.django_db
def test_create_card_details_with_invalid_date_format():
    """Invalid nested `release_date` should produce a 400 response."""
    from collectibles.tests.factories import UserFactory, VendorFactory
    from collectibles.models import UserProfile

    client = APIClient()
    vendor = VendorFactory.create()
    user = UserFactory.create()
    UserProfile.objects.create(user=user, vendor=vendor)
    client.force_authenticate(user=user)

    payload = {
        "name": "Bad Date",
        "sku": "BAD-001",
        "quantity": 1,
        "card_details": {"release_date": "not-a-date"},
    }

    resp = client.post("/api/v1/collectibles/", payload, format='json')
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
    resp = client.post("/api/v1/collectibles/", payload, format='json')
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_user_without_vendor_can_create_collectible_without_vendor_field():
    """Users without a vendor profile may create a collectible that has no vendor."""
    from collectibles.tests.factories import UserFactory
    from collectibles.models import Collectible

    client = APIClient()
    user = UserFactory.create()
    client.force_authenticate(user=user)

    payload = {"name": "User Owned", "sku": "USER-1", "quantity": 1}
    resp = client.post("/api/v1/collectibles/", payload, format='json')
    assert resp.status_code in (200, 201)
    assert Collectible.objects.filter(sku="USER-1").exists()

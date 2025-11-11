import pytest

from rest_framework.test import APIClient

from collectibles.tests.factories import UserFactory, VendorFactory, CollectibleFactory
from collectibles.models import UserProfile, Collectible


@pytest.mark.django_db
def test_list_scoped_to_user_vendor():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    # Create collectibles for both vendors
    CollectibleFactory.create(vendor=vendor1, sku="VEND-A-001")
    CollectibleFactory.create(vendor=vendor2, sku="VEND-B-001")

    # Create a user and attach them to vendor1 via UserProfile
    user = UserFactory.create(username="vendoruser")
    UserProfile.objects.create(user=user, vendor=vendor1)

    client = APIClient()
    client.force_authenticate(user=user)

    url = "/api/v1/collectibles/"
    resp = client.get(url)
    assert resp.status_code == 200
    data = resp.json()

    # Ensure we only see items for vendor1
    assert any(item.get('sku') == "VEND-A-001" for item in data)
    assert not any(item.get('sku') == "VEND-B-001" for item in data)


@pytest.mark.django_db
def test_create_with_wrong_vendor_forbidden():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    user = UserFactory.create(username="creator")
    UserProfile.objects.create(user=user, vendor=vendor1)

    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"name": "Bad create", "sku": "BAD-001", "quantity": 1, "vendor": vendor2.id}
    resp = client.post("/api/v1/collectibles/", payload, format='json')

    assert resp.status_code == 403


@pytest.mark.django_db
def test_owner_can_create_for_their_vendor():
    vendor1 = VendorFactory.create()
    user = UserFactory.create(username="owner")
    UserProfile.objects.create(user=user, vendor=vendor1)

    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"name": "Good create", "sku": "GOOD-001", "quantity": 2}
    resp = client.post("/api/v1/collectibles/", payload, format='json')

    assert resp.status_code in (200, 201)
    assert Collectible.objects.filter(sku="GOOD-001", vendor=vendor1, user=user).exists()

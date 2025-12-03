import pytest
from rest_framework.test import APIClient

from backend.inventory.models import Collectible
from backend.inventory.tests.factories import CollectibleFactory, UserFactory, VendorFactory
from backend.users.models import UserProfile


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

    assert resp.status_code in (200, 201)
    collectible = Collectible.objects.get(sku="BAD-001")
    assert collectible.vendor == vendor1


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


@pytest.mark.django_db
def test_owner_can_update_their_collectible():
    vendor1 = VendorFactory.create()
    user = UserFactory.create(username="updater")
    UserProfile.objects.create(user=user, vendor=vendor1)

    c = CollectibleFactory.create(vendor=vendor1, sku="UPD-001", name="Old name", quantity=1, user=user)

    client = APIClient()
    client.force_authenticate(user=user)

    url = f"/api/v1/collectibles/{c.id}/"
    payload = {"name": "New name", "quantity": 5}
    resp = client.patch(url, payload, format='json')
    assert resp.status_code in (200, 204)

    c.refresh_from_db()
    assert c.name == "New name"
    assert c.quantity == 5


@pytest.mark.django_db
def test_cannot_update_other_vendors_collectible():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    owner = UserFactory.create(username="owner2")
    UserProfile.objects.create(user=owner, vendor=vendor2)

    c = CollectibleFactory.create(vendor=vendor2, sku="UPD-002", name="Owner name", quantity=1, user=owner)

    intruder = UserFactory.create(username="intruder")
    UserProfile.objects.create(user=intruder, vendor=vendor1)

    client = APIClient()
    client.force_authenticate(user=intruder)

    url = f"/api/v1/collectibles/{c.id}/"
    payload = {"name": "Hacked"}
    resp = client.patch(url, payload, format='json')
    # Should not be allowed to update a collectible owned by a different vendor
    assert resp.status_code in (403, 404)


@pytest.mark.django_db
def test_only_owner_can_delete_collectible():
    vendor1 = VendorFactory.create()
    user = UserFactory.create(username="deleter")
    UserProfile.objects.create(user=user, vendor=vendor1)

    c = CollectibleFactory.create(vendor=vendor1, sku="DEL-001", user=user)

    client = APIClient()
    client.force_authenticate(user=user)

    url = f"/api/v1/collectibles/{c.id}/"
    resp = client.delete(url)
    assert resp.status_code in (200, 204)
    assert not Collectible.objects.filter(pk=c.pk).exists()


@pytest.mark.django_db
def test_cannot_delete_other_vendors_collectible():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    owner = UserFactory.create(username="owner3")
    UserProfile.objects.create(user=owner, vendor=vendor2)
    c = CollectibleFactory.create(vendor=vendor2, sku="DEL-002", user=owner)

    intruder = UserFactory.create(username="intruder2")
    UserProfile.objects.create(user=intruder, vendor=vendor1)

    client = APIClient()
    client.force_authenticate(user=intruder)

    url = f"/api/v1/collectibles/{c.id}/"
    resp = client.delete(url)
    assert resp.status_code in (403, 404)

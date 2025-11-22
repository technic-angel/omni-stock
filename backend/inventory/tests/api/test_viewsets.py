import pytest

from rest_framework.test import APIClient
from django.urls import reverse

from django.contrib.auth import get_user_model

from backend.inventory.tests.factories import CollectibleFactory, UserFactory
from backend.inventory.models import Collectible
from backend.users.models import UserProfile


@pytest.mark.django_db
def test_collectible_viewset_list_and_create():
    client = APIClient()

    # create a couple of items (they will be associated with a vendor)
    first = CollectibleFactory.create(name="View Card 1", sku="VIEW-001")
    CollectibleFactory.create(name="View Card 2", sku="VIEW-002", vendor=first.vendor)

    url = "/api/v1/collectibles/"
    # API requires authentication by default; authenticate a test user
    user = UserFactory.create(username="tester")
    # attach the test user to the same vendor so the list is scoped to them
    UserProfile.objects.create(user=user, vendor=first.vendor)
    client.force_authenticate(user=user)

    resp = client.get(url)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    payload = {"name": "Created via API", "sku": "VIEW-003", "quantity": 3}
    resp = client.post(url, payload, format='json')
    assert resp.status_code in (200, 201)
    assert Collectible.objects.filter(sku="VIEW-003").exists()


@pytest.mark.django_db
def test_collectible_create_with_image_url():
    client = APIClient()

    user = UserFactory.create(username="img_user")
    UserProfile.objects.create(user=user)
    client.force_authenticate(user=user)

    url = "/api/v1/collectibles/"
    payload = {
        "name": "Image Item",
        "sku": "IMG-API-1",
        "quantity": 1,
        "image_url": "https://example.com/img.png",
    }
    resp = client.post(url, payload, format='json')
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert body.get("image_url") == payload["image_url"]


@pytest.mark.django_db
def test_collectible_patch_image_url():
    client = APIClient()
    collectible = CollectibleFactory.create(sku="PATCH-IMG-1")
    user = UserFactory.create(username="patch_user")
    UserProfile.objects.create(user=user, vendor=collectible.vendor)
    client.force_authenticate(user=user)

    url = f"/api/v1/collectibles/{collectible.pk}/"
    payload = {"image_url": "https://example.com/new-image.png"}
    resp = client.patch(url, payload, format='json')
    assert resp.status_code in (200, 202, 204)

    collectible.refresh_from_db()
    assert collectible.image_url == payload["image_url"]

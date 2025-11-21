import pytest

from rest_framework.test import APIClient
from django.urls import reverse

from django.contrib.auth import get_user_model

from backend.inventory.tests.factories import CollectibleFactory, UserFactory
from collectibles.models import Collectible, UserProfile


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

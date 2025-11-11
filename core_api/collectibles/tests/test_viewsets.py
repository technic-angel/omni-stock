import pytest

from rest_framework.test import APIClient
from django.urls import reverse

from django.contrib.auth import get_user_model
from collectibles.models import Collectible


@pytest.mark.django_db
def test_collectible_viewset_list_and_create():
    client = APIClient()

    # create a couple of items
    Collectible.objects.create(name="View Card 1", sku="VIEW-001", quantity=1)
    Collectible.objects.create(name="View Card 2", sku="VIEW-002", quantity=2)

    url = "/api/v1/collectibles/"
    # API requires authentication by default; authenticate a test user
    User = get_user_model()
    user = User.objects.create_user(username="tester", password="pass")
    client.force_authenticate(user=user)

    resp = client.get(url)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

    payload = {"name": "Created via API", "sku": "VIEW-003", "quantity": 3}
    resp = client.post(url, payload, format='json')
    assert resp.status_code in (200, 201)
    assert Collectible.objects.filter(sku="VIEW-003").exists()

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from backend.catalog.tests.factories import CatalogItemFactory, StoreFactory, UserFactory, VendorFactory
from backend.org.models import VendorMember

@pytest.mark.django_db
def test_inventory_overview_api():
    client = APIClient()
    user = UserFactory()
    vendor = VendorFactory()
    # attach membership
    VendorMember.objects.create(user=user, vendor=vendor, is_active=True, is_primary=True)
    store = StoreFactory(vendor=vendor)

    CatalogItemFactory(
        vendor=vendor,
        store=store,
        quantity=10,
        price=10.00,
        category="pokemon_card",
    )

    client.force_authenticate(user=user)
    url = reverse("inventory-overview")
    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["stats"]["portfolioValue"] == "100.00"
    assert response.data["categoryBreakdown"][0]["category"] == "pokemon_card"
    assert response.data["categoryBreakdown"][0]["value"] == "100.00"
    assert len(response.data["topItems"]) == 1
    assert response.data["topItems"][0]["value"] == "100.00"

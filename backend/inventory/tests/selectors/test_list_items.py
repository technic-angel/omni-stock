import pytest
from django.core.exceptions import ObjectDoesNotExist

from backend.inventory.tests.factories import (
    CardDetailsFactory,
    CollectibleFactory,
    UserFactory,
    VendorFactory,
)
from collectibles.models import UserProfile

from backend.inventory.selectors.get_item import get_item
from backend.inventory.selectors.list_items import list_items


@pytest.mark.django_db
def test_list_items_scopes_to_user_vendor():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    CollectibleFactory.create(vendor=vendor1, sku="SEL-001")
    CollectibleFactory.create(vendor=vendor2, sku="SEL-002")

    user = UserFactory.create()
    UserProfile.objects.create(user=user, vendor=vendor1)

    queryset = list_items(user=user, filters={})
    skus = list(queryset.values_list("sku", flat=True))

    assert "SEL-001" in skus
    assert "SEL-002" not in skus


@pytest.mark.django_db
def test_list_items_filters_language():
    collectible = CollectibleFactory.create(sku="FILTER-1")
    CardDetailsFactory.create(collectible=collectible, language="Japanese")

    user = UserFactory.create()
    UserProfile.objects.create(user=user, vendor=collectible.vendor)

    queryset = list_items(user=user, filters={"language": "japanese"})
    assert queryset.count() == 1
    assert queryset.first().sku == "FILTER-1"


@pytest.mark.django_db
def test_get_item_respects_scope():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    authorized = UserFactory.create(username="authorized")
    intruder = UserFactory.create(username="intruder")
    UserProfile.objects.create(user=authorized, vendor=vendor1)
    UserProfile.objects.create(user=intruder, vendor=vendor2)

    collectible = CollectibleFactory.create(vendor=vendor1, sku="SEL-003")

    scoped = get_item(user=authorized, collectible_id=collectible.pk)
    assert scoped.pk == collectible.pk

    with pytest.raises(ObjectDoesNotExist):
        get_item(user=intruder, collectible_id=collectible.pk)

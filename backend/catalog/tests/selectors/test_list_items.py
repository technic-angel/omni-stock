import pytest
from django.core.exceptions import ObjectDoesNotExist

from backend.catalog.selectors.get_item import get_item
from backend.catalog.selectors.list_items import list_items
from backend.catalog.tests.factories import (
    CardMetadataFactory,
    CatalogItemFactory,
    UserFactory,
    VendorFactory,
)
from backend.org.models import VendorMember, VendorMemberRole


@pytest.mark.django_db
def test_list_items_scopes_to_user_vendor():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    CatalogItemFactory.create(vendor=vendor1, sku="SEL-001")
    CatalogItemFactory.create(vendor=vendor2, sku="SEL-002")

    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor1,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    queryset = list_items(user=user, filters={})
    skus = list(queryset.values_list("sku", flat=True))

    assert "SEL-001" in skus
    assert "SEL-002" not in skus


@pytest.mark.django_db
def test_list_items_filters_language():
    collectible = CatalogItemFactory.create(sku="FILTER-1")
    CardMetadataFactory.create(item=collectible, language="Japanese")

    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=collectible.vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    queryset = list_items(user=user, filters={"language": "japanese"})
    assert queryset.count() == 1
    assert queryset.first().sku == "FILTER-1"


@pytest.mark.django_db
def test_get_item_respects_scope():
    vendor1 = VendorFactory.create()
    vendor2 = VendorFactory.create()

    authorized = UserFactory.create(username="authorized")
    intruder = UserFactory.create(username="intruder")
    VendorMember.objects.create(
        vendor=vendor1,
        user=authorized,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )
    VendorMember.objects.create(
        vendor=vendor2,
        user=intruder,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    collectible = CatalogItemFactory.create(vendor=vendor1, sku="SEL-003")

    scoped = get_item(user=authorized, item_id=collectible.pk)
    assert scoped.pk == collectible.pk

    with pytest.raises(ObjectDoesNotExist):
        get_item(user=intruder, item_id=collectible.pk)

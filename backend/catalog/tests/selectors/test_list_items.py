import pytest
from django.core.exceptions import ObjectDoesNotExist

from backend.catalog.selectors.get_item import get_item
from backend.catalog.selectors.list_items import list_items
from backend.catalog.selectors.search_items import search_items
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


@pytest.mark.django_db
def test_list_items_filters_by_store_and_status():
    vendor = VendorFactory.create()
    store_a = vendor.stores.create(name="Store A")
    store_b = vendor.stores.create(name="Store B")
    active_item = CatalogItemFactory.create(vendor=vendor, store=store_a, status="active", sku="STORE-A")
    CatalogItemFactory.create(vendor=vendor, store=store_b, status="archived", sku="STORE-B")

    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    qs = list_items(user=user, filters={"store": store_a.id, "status": "active"})
    assert list(qs.values_list("sku", flat=True)) == [active_item.sku]


@pytest.mark.django_db
def test_list_items_applies_search_text():
    vendor = VendorFactory.create()
    search_item = CatalogItemFactory.create(vendor=vendor, name="Charizard VMAX", sku="POKE-123")
    CatalogItemFactory.create(vendor=vendor, name="Bulk Energy", sku="ENERGY-001")

    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    qs = list_items(user=user, filters={"search": "charizard"})
    assert qs.count() == 1
    assert qs.first().sku == search_item.sku


@pytest.mark.django_db
def test_search_items_enforces_min_length():
    vendor = VendorFactory.create()
    CatalogItemFactory.create(vendor=vendor, name="Charizard V", sku="POK-001")

    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )

    empty_results = search_items(user=user, query=" ")
    assert empty_results.count() == 0

    results = search_items(user=user, query="Char")
    assert results.count() == 1

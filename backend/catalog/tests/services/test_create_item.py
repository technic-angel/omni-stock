import pytest

from backend.catalog.models import CardMetadata, CatalogItem
from backend.catalog.services.create_item import create_item
from backend.catalog.services.delete_item import delete_item
from backend.catalog.services.update_item import update_item
from backend.catalog.tests.factories import (
    CatalogItemFactory,
    CatalogVariantFactory,
    StoreFactory,
    UserFactory,
    VendorFactory,
)


@pytest.mark.django_db
def test_create_item_with_nested_card_details():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)
    user = UserFactory.create()

    collectible = create_item(
        data={
            "name": "Service Card",
            "sku": "SRV-001",
            "quantity": 2,
            "vendor": vendor,
            "store": store,
            "user": user,
        },
        card_details_data={"language": "English"},
    )

    assert isinstance(collectible, CatalogItem)
    assert collectible.vendor == vendor
    assert collectible.card_details.language == "English"


@pytest.mark.django_db
def test_create_item_with_image_url():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)
    collectible = create_item(
        data={
            "name": "Image Card",
            "sku": "IMG-001",
            "quantity": 1,
            "vendor": vendor,
            "store": store,
            "image_url": "https://example.com/img.jpg",
        },
    )
    assert collectible.image_url == "https://example.com/img.jpg"


@pytest.mark.django_db
def test_create_item_records_pricing_fields():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)
    collectible = create_item(
        data={
            "name": "Price Card",
            "sku": "PRICE-001",
            "quantity": 1,
            "vendor": vendor,
            "store": store,
            "intake_price": "11.00",
            "price": "20.00",
            "projected_price": "25.00",
            "category": "CatalogItems",
            "condition": "Excellent",
        },
    )
    assert str(collectible.price) == "20.00"
    assert collectible.category == "CatalogItems"
    assert collectible.condition == "Excellent"


@pytest.mark.django_db
def test_update_item_updates_nested_details():
    collectible = CatalogItemFactory.create(name="Old", quantity=1)
    CardMetadata.objects.filter(item=collectible).delete()

    update_item(
        instance=collectible,
        data={"name": "Updated", "quantity": 5},
        card_details_data={"language": "Spanish"},
    )

    collectible.refresh_from_db()
    assert collectible.name == "Updated"
    assert collectible.card_details.language == "Spanish"


@pytest.mark.django_db
def test_create_item_with_variants():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)

    collectible = create_item(
        data={
            "name": "Variant Card",
            "sku": "VAR-001",
            "quantity": 2,
            "vendor": vendor,
            "store": store,
        },
        variant_payloads=[
            {"condition": "Raw", "grade": None, "quantity": 1, "price_adjustment": "0.00"},
            {"condition": "PSA 10", "grade": "PSA", "quantity": 1, "price_adjustment": "50.00"},
        ],
    )

    assert collectible.variants.count() == 2
    labels = set(collectible.variants.values_list("condition", flat=True))
    assert labels == {"Raw", "PSA 10"}


@pytest.mark.django_db
def test_update_item_replaces_variants():
    variant = CatalogVariantFactory.create(condition="Raw", quantity=1)
    collectible = variant.item

    update_item(
        instance=collectible,
        data={"name": collectible.name},
        variant_payloads=[{"condition": "BGS 9.5", "grade": "BGS", "quantity": 2}],
    )

    collectible.refresh_from_db()
    assert collectible.variants.count() == 1
    updated = collectible.variants.first()
    assert updated.condition == "BGS 9.5"
    assert updated.quantity == 2


@pytest.mark.django_db
def test_delete_item_removes_record():
    collectible = CatalogItemFactory.create()
    delete_item(instance=collectible)
    assert not CatalogItem.objects.filter(pk=collectible.pk).exists()

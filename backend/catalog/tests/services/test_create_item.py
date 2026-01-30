import pytest

from backend.catalog.models import CardMetadata, CatalogItem, StockLedger
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
            "category": "pokemon_card",
            "condition": "Excellent",
        },
    )
    assert str(collectible.price) == "20.00"
    assert collectible.category == "pokemon_card"
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
def test_update_item_with_media_payloads():
    collectible = CatalogItemFactory.create()
    
    # 1. Update with new media
    media_payloads = [
        {"url": "https://img.com/1.png", "media_type": "primary", "sort_order": 0},
        {"url": "https://img.com/2.png", "media_type": "gallery", "sort_order": 1}
    ]
    update_item(instance=collectible, data={}, media_payloads=media_payloads)
    
    collectible.refresh_from_db()
    assert collectible.media.count() == 2
    assert collectible.media.get(sort_order=0).url == "https://img.com/1.png"

    # 2. Clear media
    update_item(instance=collectible, data={}, media_payloads=[])
    
    collectible.refresh_from_db()
    assert collectible.media.count() == 0


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


@pytest.mark.django_db
def test_create_item_logs_initial_stock_ledger_entry():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)
    user = UserFactory.create()

    collectible = create_item(
        data={
            "name": "Ledger Seed",
            "sku": "LEDGER-001",
            "quantity": 5,
            "vendor": vendor,
            "store": store,
            "user": user,
        },
    )

    entry = StockLedger.objects.get(item=collectible)
    assert entry.transaction_type == "add"
    assert entry.quantity_before == 0
    assert entry.quantity_after == 5
    assert entry.created_by == user


@pytest.mark.django_db
def test_update_item_logs_quantity_change_to_stock_ledger():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)
    user = UserFactory.create()
    collectible = CatalogItemFactory.create(vendor=vendor, store=store, quantity=2, user=user)

    update_item(instance=collectible, data={"name": collectible.name, "quantity": 7})
    collectible.refresh_from_db()

    entry = StockLedger.objects.filter(item=collectible).latest("created_at")
    assert entry.transaction_type == "adjustment"
    assert entry.quantity_before == 2
    assert entry.quantity_after == 7
    assert entry.quantity_delta == 5


@pytest.mark.django_db
def test_create_item_with_media_payloads():
    vendor = VendorFactory.create()
    store = StoreFactory.create(vendor=vendor)

    media_payloads = [
        {
            "url": "https://example.com/1.jpg",
            "media_type": "primary",
            "sort_order": 0,
            "width": 100,
            "height": 100,
        },
        {
            "url": "https://example.com/2.jpg",
            "media_type": "gallery",
            "sort_order": 1,
            "width": 100,
            "height": 100,
        },
    ]

    item = create_item(
        data={
            "name": "Media Item",
            "sku": "MEDIA-001",
            "quantity": 1,
            "vendor": vendor,
            "store": store,
        },
        media_payloads=media_payloads,
    )

    assert item.media.count() == 2
    primary = item.media.filter(media_type="primary").first()
    assert primary.url == "https://example.com/1.jpg"
    assert primary.sort_order == 0


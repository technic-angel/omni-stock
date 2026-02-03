import pytest

from backend.catalog.services.variants import sync_item_variants
from backend.catalog.tests.factories import CatalogItemFactory


@pytest.mark.django_db
def test_sync_item_variants_creates_variants():
    item = CatalogItemFactory.create()
    payloads = [
        {"condition": "Raw", "grade": "", "quantity": 2, "price_adjustment": 0},
        {"condition": "PSA", "grade": "10", "quantity": 1, "price_adjustment": 50},
    ]

    sync_item_variants(item=item, variants_payload=payloads)

    assert item.variants.count() == 2


@pytest.mark.django_db
def test_sync_item_variants_rejects_duplicates():
    item = CatalogItemFactory.create()
    payloads = [
        {"condition": "Raw", "grade": "", "quantity": 1},
        {"condition": "Raw", "grade": "", "quantity": 3},
    ]

    with pytest.raises(ValueError, match="Duplicate variant"):
        sync_item_variants(item=item, variants_payload=payloads)

import pytest

from backend.catalog.tests.factories import CatalogItemFactory
from backend.catalog.services.variants import sync_item_variants
from backend.catalog.models import CatalogVariant


pytestmark = pytest.mark.django_db


def test_sync_none_leaves_variants():
    item = CatalogItemFactory(quantity=1)
    # create an existing variant
    CatalogVariant.objects.create(item=item, condition="Raw", grade="N/A", quantity=2, price_adjustment=0)
    sync_item_variants(item=item, variants_payload=None)
    assert CatalogVariant.objects.filter(item=item).count() == 1


def test_sync_empty_clears_variants():
    item = CatalogItemFactory(quantity=1)
    CatalogVariant.objects.create(item=item, condition="Raw", grade="N/A", quantity=2, price_adjustment=0)
    sync_item_variants(item=item, variants_payload=[])
    assert CatalogVariant.objects.filter(item=item).count() == 0


def test_sync_creates_variants_and_validates_fields():
    item = CatalogItemFactory(quantity=1)
    payload = [
        {"condition": "Raw", "grade": "", "quantity": 3, "price_adjustment": "1.50"},
        {"condition": "PSA", "grade": "10", "quantity": "2", "price_adjustment": 0},
    ]
    sync_item_variants(item=item, variants_payload=payload)
    variants = list(CatalogVariant.objects.filter(item=item))
    assert len(variants) == 2
    by_condition = {v.condition: v for v in variants}
    assert by_condition["Raw"].quantity == 3
    assert float(by_condition["Raw"].price_adjustment) == pytest.approx(1.5)


def test_sync_duplicate_raises_value_error():
    item = CatalogItemFactory(quantity=1)
    payload = [
        {"condition": "Raw", "grade": "A", "quantity": 1},
        {"condition": "Raw", "grade": "A", "quantity": 2},
    ]
    with pytest.raises(ValueError):
        sync_item_variants(item=item, variants_payload=payload)


def test_sync_invalid_quantity_or_price_raises():
    item = CatalogItemFactory(quantity=1)
    with pytest.raises(ValueError):
        sync_item_variants(item=item, variants_payload=[{"quantity": "not-an-int"}])

    with pytest.raises(ValueError):
        sync_item_variants(item=item, variants_payload=[{"quantity": 1, "price_adjustment": "nah"}])

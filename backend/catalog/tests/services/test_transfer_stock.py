import pytest

from backend.catalog.services.transfer_stock import transfer_stock
from backend.catalog.tests.factories import CatalogItemFactory, VendorFactory
from backend.org.models import Store


@pytest.mark.django_db
def test_transfer_stock_updates_store_and_ledger():
    vendor = VendorFactory.create()
    store_a = Store.objects.create(vendor=vendor, name="A")
    store_b = Store.objects.create(vendor=vendor, name="B")
    collectible = CatalogItemFactory.create(vendor=vendor)
    collectible.store = store_a
    collectible.save(update_fields=["store"])

    transfer_stock(item=collectible, to_store=store_b)

    collectible.refresh_from_db()
    assert collectible.store == store_b
    assert collectible.ledger_entries.count() == 1
    ledger = collectible.ledger_entries.first()
    assert ledger.from_store == store_a
    assert ledger.to_store == store_b

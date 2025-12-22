import contextlib

import pytest
from django.core.management import call_command
from django.db import connection

from backend.catalog.models import CatalogItem
from backend.catalog.tests.factories import CatalogItemFactory, VendorFactory
from backend.org.models import Store


@contextlib.contextmanager
def temporarily_allow_null_store():
    with connection.cursor() as cursor:
        cursor.execute('ALTER TABLE "catalog_item" ALTER COLUMN "store_id" DROP NOT NULL')
    try:
        yield
    finally:
        with connection.cursor() as cursor:
            cursor.execute('ALTER TABLE "catalog_item" ALTER COLUMN "store_id" SET NOT NULL')


@pytest.mark.django_db(transaction=True)
def test_backfill_collectible_stores_assigns_store():
    vendor = VendorFactory.create()
    store = Store.objects.create(vendor=vendor, name="Main")
    collectible = CatalogItemFactory.create(vendor=vendor, store=store)
    with temporarily_allow_null_store():
        CatalogItem.objects.filter(pk=collectible.pk).update(store=None)

        call_command("backfill_collectible_stores")

        collectible.refresh_from_db()
        assert collectible.store == store


@pytest.mark.django_db(transaction=True)
def test_backfill_collectible_stores_respects_dry_run():
    vendor = VendorFactory.create()
    store = Store.objects.create(vendor=vendor, name="Main")
    collectible = CatalogItemFactory.create(vendor=vendor)

    with temporarily_allow_null_store():
        CatalogItem.objects.filter(pk=collectible.pk).update(store=None)

        call_command("backfill_collectible_stores", dry_run=True)

        collectible.refresh_from_db()
        assert collectible.store_id is None
        CatalogItem.objects.filter(pk=collectible.pk).update(store=store)

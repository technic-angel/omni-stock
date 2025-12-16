import contextlib

import pytest
from django.core.management import call_command
from django.db import connection

from backend.inventory.models import Collectible
from backend.inventory.tests.factories import CollectibleFactory, VendorFactory
from backend.vendors.models import Store


@contextlib.contextmanager
def temporarily_allow_null_store():
    with connection.cursor() as cursor:
        cursor.execute('ALTER TABLE "collectibles_collectible" ALTER COLUMN "store_id" DROP NOT NULL')
    try:
        yield
    finally:
        with connection.cursor() as cursor:
            cursor.execute('ALTER TABLE "collectibles_collectible" ALTER COLUMN "store_id" SET NOT NULL')


@pytest.mark.django_db(transaction=True)
def test_backfill_collectible_stores_assigns_store():
    vendor = VendorFactory.create()
    store = Store.objects.create(vendor=vendor, name="Main")
    collectible = CollectibleFactory.create(vendor=vendor, store=store)
    with temporarily_allow_null_store():
        Collectible.objects.filter(pk=collectible.pk).update(store=None)

        call_command("backfill_collectible_stores")

        collectible.refresh_from_db()
        assert collectible.store == store


@pytest.mark.django_db(transaction=True)
def test_backfill_collectible_stores_respects_dry_run():
    vendor = VendorFactory.create()
    store = Store.objects.create(vendor=vendor, name="Main")
    collectible = CollectibleFactory.create(vendor=vendor)

    with temporarily_allow_null_store():
        Collectible.objects.filter(pk=collectible.pk).update(store=None)

        call_command("backfill_collectible_stores", dry_run=True)

        collectible.refresh_from_db()
        assert collectible.store_id is None
        Collectible.objects.filter(pk=collectible.pk).update(store=store)

import pytest
from django.core.management import call_command

from backend.catalog.tests.factories import VendorFactory


@pytest.mark.django_db
def test_create_default_stores_adds_store_when_missing():
    vendor = VendorFactory.create()
    assert not vendor.stores.exists()

    call_command("create_default_stores")

    vendor.refresh_from_db()
    assert vendor.stores.count() == 1
    assert vendor.stores.first().name == "Default Store"


@pytest.mark.django_db
def test_create_default_stores_dry_run_does_not_create():
    vendor = VendorFactory.create()

    call_command("create_default_stores", dry_run=True)

    assert not vendor.stores.exists()

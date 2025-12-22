import pytest
from django.core.management import call_command

from backend.catalog.models import CardMetadata, CatalogItem
from backend.org.models import Vendor


@pytest.mark.django_db
def test_load_demo_data_creates_items():
    # seed initial data without overwrite to create demo vendor
    call_command('load_demo_data', '--count', '1')

    # request 3 demo items and overwrite existing demo vendor data
    call_command('load_demo_data', '--count', '3', '--overwrite')

    assert Vendor.objects.filter(name='Demo Vendor').exists()
    assert CatalogItem.objects.filter(sku__startswith='DEMO-').count() == 3
    
    # CardMetadata are only created for Trading Cards category
    # So we should have at least some CardMetadata, but not necessarily all
    trading_cards_count = CatalogItem.objects.filter(
        sku__startswith='DEMO-',
        category='Trading Cards'
    ).count()
    assert CardMetadata.objects.count() == trading_cards_count

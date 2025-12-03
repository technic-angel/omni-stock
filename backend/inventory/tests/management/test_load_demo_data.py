import pytest
from django.core.management import call_command

from backend.inventory.models import CardDetails, Collectible
from backend.vendors.models import Vendor


@pytest.mark.django_db
def test_load_demo_data_creates_items():
    # request 3 demo items and overwrite existing demo vendor data
    call_command('load_demo_data', '--count', '3', '--overwrite')

    assert Vendor.objects.filter(name='Demo Vendor').exists()
    assert Collectible.objects.filter(sku__startswith='DEMO-').count() == 3
    
    # CardDetails are only created for Trading Cards category
    # So we should have at least some CardDetails, but not necessarily all
    trading_cards_count = Collectible.objects.filter(
        sku__startswith='DEMO-',
        category='Trading Cards'
    ).count()
    assert CardDetails.objects.count() == trading_cards_count

import pytest

from django.core.management import call_command

from collectibles.models import Vendor, Collectible, CardDetails


@pytest.mark.django_db
def test_load_demo_data_creates_items():
    # request 3 demo items and overwrite existing demo vendor data
    call_command('load_demo_data', '--count', '3', '--overwrite')

    assert Vendor.objects.filter(name='Demo Vendor').exists()
    assert Collectible.objects.filter(sku__startswith='DEMO-').count() == 3
    # ensure card details were created for the demo collectibles
    assert CardDetails.objects.count() >= 3

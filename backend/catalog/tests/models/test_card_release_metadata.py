import pytest

from backend.catalog.tests.factories import CardMetadataFactory, CatalogItemFactory


@pytest.mark.django_db
def test_card_details_release_metadata_stored_and_serialized():
    c = CatalogItemFactory.create()
    cd = CardMetadataFactory.create(item=c, language='English', market_region='US')
    cd.refresh_from_db()
    assert cd.language == 'English'
    assert cd.market_region == 'US'

    # ensure nested serializer includes these fields
    from backend.catalog.api.serializers import CatalogItemSerializer
    ser = CatalogItemSerializer(c)
    data = ser.data
    # card_details is read-only nested representation
    assert 'card_details' in data
    assert data['card_details']['language'] == 'English'

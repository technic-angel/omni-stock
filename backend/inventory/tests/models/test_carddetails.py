import pytest
from decimal import Decimal

from backend.inventory.tests.factories import CardDetailsFactory, CollectibleFactory


@pytest.mark.django_db
def test_psa_grade_stored_and_retrieved():
    c = CollectibleFactory.create()
    cd = CardDetailsFactory.create(collectible=c, psa_grade=Decimal('8.5'))
    cd.refresh_from_db()
    assert cd.psa_grade == Decimal('8.5')


@pytest.mark.django_db
def test_get_external_ids_handles_invalid_json():
    c = CollectibleFactory.create()
    cd = CardDetailsFactory.create(collectible=c, external_ids='not-json')
    assert cd.get_external_ids() == {}


@pytest.mark.django_db
def test_set_external_ids_handles_unserializable():
    c = CollectibleFactory.create()
    cd = CardDetailsFactory.create(collectible=c)

    # provide an unserializable object (a function) -- set_external_ids should handle this
    cd.set_external_ids(lambda x: x)
    # save and ensure external_ids is None (set_external_ids catches exceptions)
    cd.save()
    assert cd.external_ids is None

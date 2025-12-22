from decimal import Decimal

import pytest

from backend.catalog.tests.factories import CardMetadataFactory, CatalogItemFactory


@pytest.mark.django_db
def test_psa_grade_stored_and_retrieved():
    c = CatalogItemFactory.create()
    cd = CardMetadataFactory.create(item=c, psa_grade=Decimal('8.5'))
    cd.refresh_from_db()
    assert cd.psa_grade == Decimal('8.5')


@pytest.mark.django_db
def test_get_external_ids_handles_invalid_json():
    c = CatalogItemFactory.create()
    cd = CardMetadataFactory.create(item=c, external_ids='not-json')
    assert cd.get_external_ids() == {}


@pytest.mark.django_db
def test_set_external_ids_handles_unserializable():
    c = CatalogItemFactory.create()
    cd = CardMetadataFactory.create(item=c)

    # provide an unserializable object (a function) -- set_external_ids should handle this
    cd.set_external_ids(lambda x: x)
    # save and ensure external_ids is None (set_external_ids catches exceptions)
    cd.save()
    assert cd.external_ids is None

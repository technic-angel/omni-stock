from types import SimpleNamespace

import pytest

from backend.catalog.models import CardMetadata
from backend.catalog.tests.factories import (
    CardMetadataFactory,
    CatalogItemFactory,
    CatalogVariantFactory,
    VendorFactory,
)


@pytest.mark.django_db
def test_vendor_slug_generation():
    v1 = VendorFactory.create(name="Acme Cards")
    assert v1.slug and v1.slug.startswith("acme-cards")

    v2 = VendorFactory.create(name="Acme Cards")
    # ensure uniqueness
    assert v2.slug != v1.slug


@pytest.mark.django_db
def test_carddetails_external_ids_helper():
    c = CatalogItemFactory.create(name="Test Card", sku="TEST-001")
    cd = CardMetadataFactory.create(item=c)

    # initially empty
    assert cd.get_external_ids() == {}

    cd.set_external_ids({"foo": "bar"})
    cd.save()
    assert cd.get_external_ids() == {"foo": "bar"}


@pytest.mark.django_db
def test_carddetails_str_with_sku():
    c = CatalogItemFactory.create(name="Str Card", sku="STR-001")
    cd = CardMetadataFactory.create(item=c)
    assert str(cd) == "CardMetadata for STR-001"


@pytest.mark.django_db
def test_carddetails_str_unsaved():
    # unsaved CardMetadata without a PK or related collectible should show a clear marker
    cd = CardMetadata()
    assert str(cd) == "CardMetadata (unsaved)"


@pytest.mark.django_db
def test_carddetails_str_saved_collectible_missing_sku():
    # Saved CardMetadata where the related CatalogItem at runtime has no `sku`
    # attribute (e.g., defensive runtime case) should fall back to the CardMetadata PK.
    c = CatalogItemFactory.create(name="NoSKU Card", sku="NSKU-001")
    cd = CardMetadataFactory.create(item=c)

    # Simulate a runtime collectible object lacking a sku attribute by
    # setting the related-object cache to a simple object that does not
    # expose `sku`. We set the field cache directly to avoid descriptor
    # type checks when assigning a non-model instance.
    # Rather than fight the Django descriptor/cache behavior, call the
    # underlying __str__ logic with a minimal fake object that mirrors
    # the attributes we care about (no `sku` on the related collectible).
    fake = SimpleNamespace(item=SimpleNamespace(), pk=cd.pk)
    assert CardMetadata.__str__(fake) == f"CardMetadata for {cd.pk}"


@pytest.mark.django_db
def test_catalog_variant_str_uses_sku_and_condition():
    variant = CatalogVariantFactory.create(condition="PSA 10")
    assert str(variant) == f"{variant.item.sku} - PSA 10"

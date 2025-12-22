from decimal import Decimal

import pytest
from django.test import override_settings

from backend.catalog.api.serializers import CatalogItemSerializer
from backend.catalog.models import CatalogItem
from backend.catalog.tests.factories import CatalogItemFactory, StoreFactory


@pytest.mark.django_db
def test_collectible_serializer_roundtrip():
    # Create an instance and serialize it
    c = CatalogItemFactory.create(name="Serializer Card", sku="SER-001", quantity=2)
    data = CatalogItemSerializer(c).data

    assert data["sku"] == "SER-001"
    assert data["name"] == "Serializer Card"

    # Test creating via serializer
    payload = {
        "name": "New Card",
        "sku": "SER-002",
        "quantity": 5,
        "category": "TCG",
        "condition": "Mint",
        "price": "25.00",
        "intake_price": "10.00",
        "projected_price": "30.00",
        "variant_payloads": [
            {"condition": "Raw", "quantity": 3, "price_adjustment": "0.00"},
        ],
    }
    store = StoreFactory.create()
    payload["store"] = store.id
    ser = CatalogItemSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save(store=store, vendor=store.vendor)
    assert CatalogItem.objects.filter(pk=obj.pk, sku="SER-002").exists()
    assert obj.price == Decimal("25.00")
    assert obj.category == "TCG"
    assert obj.condition == "Mint"
    assert obj.variants.count() == 1
    serialized = CatalogItemSerializer(obj).data
    assert serialized["variants"][0]["condition"] == "Raw"


@pytest.mark.django_db
def test_collectible_serializer_image_url():
    store = StoreFactory.create()
    payload = {
        "name": "Image Card",
        "sku": "SER-IMG",
        "quantity": 1,
        "image_url": "https://example.com/img.png",
        "store": store.id,
    }
    ser = CatalogItemSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save(store=store, vendor=store.vendor)
    assert obj.image_url == payload["image_url"]
    assert obj.created_at is not None
    assert obj.updated_at is not None


@pytest.mark.django_db
def test_collectible_serializer_rejects_non_https_image_url():
    store = StoreFactory.create()
    payload = {
        "name": "Image Card",
        "sku": "SER-IMG-HTTP",
        "quantity": 1,
        "image_url": "http://example.com/img.png",
        "store": store.id,
    }
    ser = CatalogItemSerializer(data=payload)
    assert not ser.is_valid()
    assert "image_url" in ser.errors


@pytest.mark.django_db
@override_settings(ALLOWED_IMAGE_URL_HOSTS=["images.example.com"])
def test_collectible_serializer_respects_allowed_image_hosts():
    store = StoreFactory.create()
    allowed_payload = {
        "name": "Allowed Image",
        "sku": "SER-IMG-ALLOW",
        "quantity": 1,
        "image_url": "https://images.example.com/path/img.png",
        "store": store.id,
    }
    ser = CatalogItemSerializer(data=allowed_payload)
    assert ser.is_valid(), ser.errors

    blocked_payload = {
        "name": "Blocked Image",
        "sku": "SER-IMG-BLOCK",
        "quantity": 1,
        "image_url": "https://cdn.example.com/img.png",
        "store": store.id,
    }
    ser = CatalogItemSerializer(data=blocked_payload)
    assert not ser.is_valid()
    assert "image_url" in ser.errors


@pytest.mark.django_db
def test_collectible_serializer_quantity_validation():
    store = StoreFactory.create()
    payload = {"name": "Invalid Quantity", "sku": "NEG-001", "quantity": -5, "store": store.id}
    ser = CatalogItemSerializer(data=payload)
    assert not ser.is_valid()
    assert "quantity" in ser.errors


@pytest.mark.django_db
def test_collectible_serializer_creates_media_gallery():
    store = StoreFactory.create()
    payload = {
        "name": "Gallery Item",
        "sku": "GAL-001",
        "quantity": 1,
        "store": store.id,
        "image_payloads": [
            {"url": "https://cdn.dev/img1.png", "media_type": "primary", "sort_order": 0},
            {"url": "https://cdn.dev/img2.png", "media_type": "gallery", "sort_order": 1},
        ],
    }
    ser = CatalogItemSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save(store=store, vendor=store.vendor)

    assert obj.media.count() == 2
    urls = list(obj.media.order_by("sort_order").values_list("url", flat=True))
    assert urls == ["https://cdn.dev/img1.png", "https://cdn.dev/img2.png"]


@pytest.mark.django_db
def test_collectible_serializer_updates_media_gallery():
    collectible = CatalogItemFactory.create(name="Gallery Update", sku="GAL-UPD")
    initial_payload = {
        "name": collectible.name,
        "sku": collectible.sku,
        "quantity": collectible.quantity,
        "image_payloads": [{"url": "https://cdn.dev/original.png", "media_type": "primary"}],
    }
    ser = CatalogItemSerializer(instance=collectible, data=initial_payload)
    assert ser.is_valid(), ser.errors
    ser.save()

    update_payload = {
        "name": collectible.name,
        "sku": collectible.sku,
        "quantity": collectible.quantity,
        "image_payloads": [{"url": "https://cdn.dev/new.png", "media_type": "primary"}],
    }
    ser = CatalogItemSerializer(instance=collectible, data=update_payload)
    assert ser.is_valid(), ser.errors
    ser.save()

    collectible.refresh_from_db()
    assert collectible.media.count() == 1
    assert collectible.media.first().url == "https://cdn.dev/new.png"


@pytest.mark.django_db
def test_collectible_serializer_updates_variants():
    collectible = CatalogItemFactory.create(name="Variant Update", sku="VAR-UPD")
    initial_payload = {
        "name": collectible.name,
        "sku": collectible.sku,
        "quantity": collectible.quantity,
        "variant_payloads": [
            {"condition": "Raw", "quantity": 1},
        ],
    }
    ser = CatalogItemSerializer(instance=collectible, data=initial_payload)
    assert ser.is_valid(), ser.errors
    ser.save()

    update_payload = {
        "name": collectible.name,
        "sku": collectible.sku,
        "quantity": collectible.quantity,
        "variant_payloads": [
            {"condition": "PSA 10", "grade": "PSA", "quantity": 2, "price_adjustment": "50.00"},
        ],
    }
    ser = CatalogItemSerializer(instance=collectible, data=update_payload)
    assert ser.is_valid(), ser.errors
    ser.save()

    collectible.refresh_from_db()
    variants = collectible.variants.all()
    assert variants.count() == 1
    assert variants.first().condition == "PSA 10"

from decimal import Decimal

import pytest

from django.test import override_settings

from backend.inventory.api.serializers import CollectibleSerializer
from backend.inventory.models import Collectible
from backend.inventory.tests.factories import CollectibleFactory


@pytest.mark.django_db
def test_collectible_serializer_roundtrip():
    # Create an instance and serialize it
    c = CollectibleFactory.create(name="Serializer Card", sku="SER-001", quantity=2)
    data = CollectibleSerializer(c).data

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
    }
    ser = CollectibleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save()
    assert Collectible.objects.filter(pk=obj.pk, sku="SER-002").exists()
    assert obj.price == Decimal("25.00")
    assert obj.category == "TCG"
    assert obj.condition == "Mint"


@pytest.mark.django_db
def test_collectible_serializer_image_url():
    payload = {"name": "Image Card", "sku": "SER-IMG", "quantity": 1, "image_url": "https://example.com/img.png"}
    ser = CollectibleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save()
    assert obj.image_url == payload["image_url"]
    assert obj.created_at is not None
    assert obj.updated_at is not None


@pytest.mark.django_db
def test_collectible_serializer_rejects_non_https_image_url():
    payload = {"name": "Image Card", "sku": "SER-IMG-HTTP", "quantity": 1, "image_url": "http://example.com/img.png"}
    ser = CollectibleSerializer(data=payload)
    assert not ser.is_valid()
    assert "image_url" in ser.errors


@pytest.mark.django_db
@override_settings(ALLOWED_IMAGE_URL_HOSTS=["images.example.com"])
def test_collectible_serializer_respects_allowed_image_hosts():
    allowed_payload = {
        "name": "Allowed Image",
        "sku": "SER-IMG-ALLOW",
        "quantity": 1,
        "image_url": "https://images.example.com/path/img.png",
    }
    ser = CollectibleSerializer(data=allowed_payload)
    assert ser.is_valid(), ser.errors

    blocked_payload = {
        "name": "Blocked Image",
        "sku": "SER-IMG-BLOCK",
        "quantity": 1,
        "image_url": "https://cdn.example.com/img.png",
    }
    ser = CollectibleSerializer(data=blocked_payload)
    assert not ser.is_valid()
    assert "image_url" in ser.errors


@pytest.mark.django_db
def test_collectible_serializer_quantity_validation():
    payload = {"name": "Invalid Quantity", "sku": "NEG-001", "quantity": -5}
    ser = CollectibleSerializer(data=payload)
    assert not ser.is_valid()
    assert "quantity" in ser.errors

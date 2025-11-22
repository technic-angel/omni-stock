import pytest

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
    payload = {"name": "New Card", "sku": "SER-002", "quantity": 5}
    ser = CollectibleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save()
    assert Collectible.objects.filter(pk=obj.pk, sku="SER-002").exists()


@pytest.mark.django_db
def test_collectible_serializer_image_url():
    payload = {"name": "Image Card", "sku": "SER-IMG", "quantity": 1, "image_url": "https://example.com/img.png"}
    ser = CollectibleSerializer(data=payload)
    assert ser.is_valid(), ser.errors
    obj = ser.save()
    assert obj.image_url == payload["image_url"]

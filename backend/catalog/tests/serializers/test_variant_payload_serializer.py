from backend.catalog.api.serializers import VariantPayloadSerializer


def test_variant_payload_rejects_non_integer_quantity():
    data = {
        "condition": "Raw",
        "grade": "",
        "quantity": "not-an-int",
        "price_adjustment": "1.00",
    }
    serializer = VariantPayloadSerializer(data=data)
    assert not serializer.is_valid()
    assert "quantity" in serializer.errors


def test_variant_payload_rejects_non_numeric_price_adjustment():
    data = {
        "condition": "Raw",
        "grade": "",
        "quantity": 1,
        "price_adjustment": "not-a-number",
    }
    serializer = VariantPayloadSerializer(data=data)
    assert not serializer.is_valid()
    assert "price_adjustment" in serializer.errors


def test_variant_payload_accepts_valid_payload():
    data = {
        "condition": "Raw",
        "grade": "",
        "quantity": 2,
        "price_adjustment": "-3.50",
    }
    serializer = VariantPayloadSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

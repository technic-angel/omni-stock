"""Inventory domain serializers."""

from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from backend.inventory.models import CardDetails, Collectible
from backend.inventory.services.create_item import create_item
from backend.inventory.services.update_item import update_item


class CardDetailsSerializer(serializers.ModelSerializer):
    """Serializer for the CardDetails nested object."""

    class Meta:
        model = CardDetails
        fields = [
            'psa_grade',
            'condition',
            'external_ids',
            'last_estimated_at',
            'language',
            'release_date',
            'print_run',
            'market_region',
            'notes',
        ]


class CollectibleSerializer(serializers.ModelSerializer):
    """Serializer for the Collectible model with nested card details support."""

    card_details = CardDetailsSerializer(required=False)

    class Meta:
        model = Collectible
        fields = [
            'id',
            'user',
            'vendor',
            'name',
            'sku',
            'description',
            'condition',
            'category',
            'image_url',
            'quantity',
            'intake_price',
            'price',
            'projected_price',
            'card_details',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'id',
            'user',
            'vendor',
            'created_at',
            'updated_at',
        )

    def validate_quantity(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

    def validate_intake_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Intake price cannot be negative.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_projected_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Projected price cannot be negative.")
        return value

    def validate_image_url(self, value):
        if not value:
            return value

        parsed = urlparse(value)
        if parsed.scheme != 'https':
            raise serializers.ValidationError("Image URLs must use HTTPS.")

        allowed_hosts = getattr(settings, 'ALLOWED_IMAGE_URL_HOSTS', [])
        if allowed_hosts and parsed.hostname not in allowed_hosts:
            raise serializers.ValidationError("Image host is not allowed.")
        return value

    def create(self, validated_data):
        card_details_data = validated_data.pop('card_details', None)
        payload = validated_data.copy()
        return create_item(data=payload, card_details_data=card_details_data)

    def update(self, instance, validated_data):
        card_details_data = validated_data.pop('card_details', None)
        return update_item(
            instance=instance,
            data=validated_data,
            card_details_data=card_details_data,
        )


__all__ = ['CardDetailsSerializer', 'CollectibleSerializer']

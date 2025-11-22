"""Inventory domain serializers."""

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
        fields = '__all__'
        read_only_fields = ('last_updated',)

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

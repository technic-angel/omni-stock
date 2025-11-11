from rest_framework import serializers
from .models import Collectible, CardDetails


class CardDetailsSerializer(serializers.ModelSerializer):
    """Serializer for the CardDetails nested object."""

    class Meta:
        model = CardDetails
        fields = [
            'psa_grade', 'condition', 'external_ids', 'last_estimated_at',
            'language', 'release_date', 'print_run', 'market_region', 'notes',
        ]


class CollectibleSerializer(serializers.ModelSerializer):
    """
    Serializer for the Collectible model.
    Includes a read-only nested `card_details` representation.
    """
    card_details = CardDetailsSerializer(read_only=True)

    class Meta:
        model = Collectible
        fields = '__all__'
        read_only_fields = ('last_updated',)
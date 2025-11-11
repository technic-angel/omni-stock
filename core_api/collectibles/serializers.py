from django.db import transaction
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
    """Serializer for the Collectible model.

    Supports writable nested `card_details` payloads. The nested handling is
    intentionally explicit and minimal: create/update will handle a provided
    `card_details` object by creating or updating the related CardDetails row.
    """
    card_details = CardDetailsSerializer(required=False)

    class Meta:
        model = Collectible
        fields = '__all__'
        read_only_fields = ('last_updated',)

    def create(self, validated_data):
        card_details_data = validated_data.pop('card_details', None)
        # validated_data may include forced kwargs passed via serializer.save()
        # (for example: user=..., vendor=...). Create the Collectible first,
        # then create CardDetails if provided.
        with transaction.atomic():
            collectible = Collectible.objects.create(**validated_data)
            if card_details_data:
                CardDetails.objects.create(collectible=collectible, **card_details_data)
        return collectible

    def update(self, instance, validated_data):
        card_details_data = validated_data.pop('card_details', None)
        # Update the collectible fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        with transaction.atomic():
            instance.save()
            if card_details_data is not None:
                # Either update existing CardDetails or create a new one
                try:
                    cd = instance.card_details
                    for k, v in card_details_data.items():
                        setattr(cd, k, v)
                    cd.save()
                except CardDetails.DoesNotExist:
                    CardDetails.objects.create(collectible=instance, **card_details_data)
        return instance
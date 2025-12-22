"""Inventory domain serializers."""

from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from backend.catalog.models import CardMetadata, CatalogItem, CatalogMedia, Store
from backend.catalog.services.create_item import create_item
from backend.catalog.services.update_item import update_item


class CardMetadataSerializer(serializers.ModelSerializer):
    """Serializer for the CardMetadata nested object."""

    class Meta:
        model = CardMetadata
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


class CatalogMediaSerializer(serializers.ModelSerializer):
    """Serializer for media associated with collectibles."""

    class Meta:
        model = CatalogMedia
        fields = [
            "id",
            "media_type",
            "url",
            "sort_order",
            "is_primary",
            "width",
            "height",
            "size_kb",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


class CatalogItemSerializer(serializers.ModelSerializer):
    """Serializer for the CatalogItem model with nested card details support."""

    card_details = CardMetadataSerializer(source="card_metadata", required=False)
    images = CatalogMediaSerializer(source="media", many=True, read_only=True)
    image_payloads = CatalogMediaSerializer(many=True, write_only=True, required=False)
    variants = serializers.SerializerMethodField()
    variant_payloads = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Optional list of variant payloads (condition/grade/quantity).",
    )
    store = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(),
        required=False,
        allow_null=False,
        help_text="Store that owns this inventory item.",
    )

    class Meta:
        model = CatalogItem
        fields = [
            'id',
            'user',
            'vendor',
            'store',
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
            'image_payloads',
            'images',
            'variants',
            'variant_payloads',
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

    def validate(self, attrs):
        attrs = super().validate(attrs)
        flag_enabled = getattr(settings, "ENABLE_VENDOR_REFACTOR", False)
        store = attrs.get("store")
        if self.instance and store is None:
            store = getattr(self.instance, "store", None)

        if flag_enabled and store is None:
            raise serializers.ValidationError({"store": "Store is required when the vendor refactor is enabled."})

        vendor = attrs.get("vendor") or getattr(self.instance, "vendor", None)
        if store is not None and vendor is not None and store.vendor_id != vendor.id:
            raise serializers.ValidationError({"store": "Store must belong to the selected vendor."})
        return attrs

    def create(self, validated_data):
        card_details_data = validated_data.pop('card_metadata', None)
        media_payloads = validated_data.pop('image_payloads', None)
        variant_payloads = validated_data.pop('variant_payloads', None)
        payload = validated_data.copy()
        return create_item(
            data=payload,
            card_details_data=card_details_data,
            media_payloads=media_payloads,
            variant_payloads=variant_payloads,
        )

    def update(self, instance, validated_data):
        card_details_data = validated_data.pop('card_metadata', None)
        media_payloads = validated_data.pop('image_payloads', None)
        variant_payloads = validated_data.pop('variant_payloads', None)
        return update_item(
            instance=instance,
            data=validated_data,
            card_details_data=card_details_data,
            media_payloads=media_payloads,
            variant_payloads=variant_payloads,
        )

    def get_variants(self, obj):
        qs = getattr(obj, "variants", None)
        if qs is None:
            return []
        variants = qs.all()
        return [
            {
                "id": variant.id,
                "condition": variant.condition,
                "grade": variant.grade,
                "quantity": variant.quantity,
                "price_adjustment": str(variant.price_adjustment),
            }
            for variant in variants
        ]


__all__ = ['CardMetadataSerializer', 'CatalogItemSerializer', 'CatalogMediaSerializer']

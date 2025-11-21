"""Vendor domain serializers."""

from rest_framework import serializers

from backend.vendors.models import Vendor
from backend.vendors.services.create_vendor import create_vendor
from backend.vendors.services.update_vendor import update_vendor


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor CRUD."""

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "contact_info",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("slug", "created_at", "updated_at")

    def create(self, validated_data):
        return create_vendor(**validated_data)

    def update(self, instance, validated_data):
        return update_vendor(instance=instance, data=validated_data)


__all__ = ["VendorSerializer"]

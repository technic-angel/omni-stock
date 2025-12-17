"""Vendor domain serializers."""

from django.conf import settings
from rest_framework import serializers

from backend.vendors.models import Store, StoreAccess, Vendor, VendorMember, VendorMemberRole
from backend.vendors.services.create_vendor import create_vendor
from backend.vendors.services.update_vendor import update_vendor


class StoreSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "slug", "type", "is_active"]
        read_only_fields = fields


class StoreSerializer(serializers.ModelSerializer):
    vendor_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Store
        fields = [
            "id",
            "vendor_id",
            "name",
            "slug",
            "type",
            "description",
            "address",
            "metadata",
            "logo_url",
            "banner_url",
            "currency",
            "default_tax_rate",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "vendor_id"]


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor CRUD."""

    stores = serializers.SerializerMethodField()

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
            "stores",
        ]
        read_only_fields = ("slug", "created_at", "updated_at", "stores")

    def create(self, validated_data):
        return create_vendor(**validated_data)

    def update(self, instance, validated_data):
        return update_vendor(instance=instance, data=validated_data)

    def get_stores(self, obj):
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            return []
        stores = obj.stores.order_by("name")
        return StoreSummarySerializer(stores, many=True).data


class VendorMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    active_store = StoreSerializer(read_only=True)

    class Meta:
        model = VendorMember
        fields = [
            "id",
            "user",
            "email",
            "role",
            "title",
            "is_active",
            "joined_at",
            "invite_status",
            "invited_at",
            "responded_at",
            "revoked_at",
            "active_store",
        ]
        read_only_fields = [
            "id",
            "user",
            "email",
            "joined_at",
            "invite_status",
            "invited_at",
            "responded_at",
            "revoked_at",
            "active_store",
        ]


class VendorMemberInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=VendorMemberRole.choices, default=VendorMemberRole.MEMBER)
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class VendorMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorMember
        fields = ["role", "title", "is_active"]


class StoreAccessSerializer(serializers.ModelSerializer):
    member_email = serializers.EmailField(source="member.user.email", read_only=True)

    class Meta:
        model = StoreAccess
        fields = ["id", "store", "member", "role", "is_active", "member_email"]
        read_only_fields = ["id", "member_email"]


class VendorSelectionSerializer(serializers.Serializer):
    vendor = serializers.PrimaryKeyRelatedField(queryset=Vendor.objects.all())


class StoreSelectionSerializer(serializers.Serializer):
    store = serializers.PrimaryKeyRelatedField(queryset=Store.objects.all())


__all__ = [
    "VendorSerializer",
    "VendorMemberSerializer",
    "VendorMemberInviteSerializer",
    "VendorMemberUpdateSerializer",
    "StoreSerializer",
    "StoreSummarySerializer",
    "StoreAccessSerializer",
    "VendorSelectionSerializer",
    "StoreSelectionSerializer",
]

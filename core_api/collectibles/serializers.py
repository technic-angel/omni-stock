from typing import Optional

from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework import serializers as drf_serializers
from rest_framework.validators import UniqueValidator
from drf_spectacular.utils import OpenApiTypes, extend_schema_field

from .models import Collectible, CardDetails

User = get_user_model()


class RegisterSerializer(drf_serializers.Serializer):
    """Serializer for user registration."""
    username = drf_serializers.CharField(
        max_length=150,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with that username already exists.")],
    )
    email = drf_serializers.EmailField(required=False, allow_blank=True)
    password = drf_serializers.CharField(write_only=True, min_length=8)

    def create(self, validated_data):
        username = validated_data.get('username')
        email = validated_data.get('email', '')
        password = validated_data.get('password')
        user = User.objects.create_user(username=username, email=email, password=password)
        # Ensure a UserProfile exists for the new user (signals could be used instead).
        try:
            from .models.user_profile import UserProfile
            UserProfile.objects.create(user=user)
        except Exception:
            # If the profile model or creation fails, don't break registration — profile is optional.
            pass
        return user


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
    # Expose a stable image URL that clients can use. This is read-only
    # and will return the absolute URL when a request is available in the
    # serializer context. This makes it easy to migrate image storage to
    # Supabase or another remote storage provider later — clients use
    # `image_url` regardless of whether the file is stored locally or
    # remotely.
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Collectible
        fields = '__all__'
        read_only_fields = ('last_updated', 'image_url')

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

    @extend_schema_field(OpenApiTypes.URI)
    def get_image_url(self, obj: Collectible) -> Optional[str]:
        """Return an absolute URL to the collectible image, or None."""
        if not obj or not getattr(obj, 'image', None):
            return None
        url = None
        try:
            # If a request is present in the context, build an absolute URI
            request = self.context.get('request')
            if request is not None:
                url = request.build_absolute_uri(obj.image.url)
            else:
                # Fallback to the storage URL (may be relative)
                url = obj.image.url
        except Exception:
            url = getattr(obj.image, 'url', None)
        return url

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
"""User domain serializers."""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from backend.users.services.create_user import create_user

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""

    username = serializers.CharField(
        max_length=150,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with that username already exists.")],
    )
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with that email already exists.")],
    )
    password = serializers.CharField(write_only=True, min_length=8)

    def create(self, validated_data):
        return create_user(
            username=validated_data.get("username"),
            email=validated_data["email"],
            password=validated_data.get("password"),
        )


__all__ = ["RegisterSerializer"]

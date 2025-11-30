"""User domain serializers."""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from backend.users.models import UserProfile
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


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model.
    
    This handles the profile-specific fields like bio, phone, and profile_picture.
    The profile_picture field is automatically converted to a full URL by DRF.
    """
    
    vendor_id = serializers.IntegerField(source='vendor.id', read_only=True, allow_null=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            "id", "phone", "bio", "profile_picture", 
            "vendor_id", "vendor_name",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Serializer for the current authenticated user.
    
    This combines User model fields with the nested UserProfile data.
    Uses nested serialization to include profile data in the response.
    """

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile"]
        read_only_fields = ["id"]


class UpdateProfilePictureSerializer(serializers.Serializer):
    """
    Serializer for updating user profile via PUT/PATCH.
    
    Handles all profile fields including:
    - User fields: username, email
    - Profile fields: phone, bio, profile_picture, vendor
    
    Supports multipart/form-data for file uploads.
    """
    
    # User fields
    username = serializers.CharField(
        max_length=150,
        required=False,
        help_text="Username (must be unique)"
    )
    email = serializers.EmailField(
        required=False,
        help_text="Email address (must be unique)"
    )
    
    # Profile fields
    phone = serializers.CharField(
        max_length=40,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Phone number"
    )
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="User bio/description"
    )
    vendor_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID of vendor to associate with (null to clear)"
    )

    @extend_schema_field(OpenApiTypes.BINARY)
    class _ProfilePictureField(serializers.ImageField):
        pass
    
    profile_picture = _ProfilePictureField(
        required=False,
        allow_null=True,
        help_text="Upload a new profile picture (JPEG, PNG, GIF, or WebP). Max size: 5MB."
    )
    
    def validate_username(self, value):
        """Check username uniqueness excluding current user."""
        user = self.instance
        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value
    
    def validate_email(self, value):
        """Check email uniqueness excluding current user."""
        user = self.instance
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    
    def validate_vendor_id(self, value):
        """Check vendor exists."""
        if value is not None:
            from backend.vendors.models import Vendor
            if not Vendor.objects.filter(id=value).exists():
                raise serializers.ValidationError("Vendor not found.")
        return value
    
    def update(self, instance, validated_data):
        """Update user profile via service layer."""
        from backend.users.services.update_user_profile import update_user_profile
        
        # Extract fields
        profile_picture = validated_data.get('profile_picture')
        vendor_id = validated_data.get('vendor_id')
        
        # Call service with all fields
        updated_user = update_user_profile(
            user_id=instance.id,
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            phone=validated_data.get('phone'),
            bio=validated_data.get('bio'),
            vendor_id=vendor_id if vendor_id else None,
            clear_vendor=vendor_id is None and 'vendor_id' in validated_data,
            profile_picture=profile_picture if profile_picture else None,
            delete_profile_picture=profile_picture is None and 'profile_picture' in validated_data,
        )
        
        return updated_user


__all__ = [
    "RegisterSerializer",
    "UserProfileSerializer",
    "CurrentUserSerializer",
    "UpdateProfilePictureSerializer",
    "ChangePasswordSerializer",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "LogoutSerializer",
]


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    
    Requires current password verification before allowing password change.
    Validates new password against Django's password validators.
    """
    
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Current password for verification"
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        help_text="New password (min 8 characters)"
    )
    
    def validate(self, attrs):
        """Verify old password and validate new password."""
        from backend.users.services.change_password import change_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        user = self.context['request'].user
        
        try:
            change_password(
                user_id=user.id,
                old_password=attrs['old_password'],
                new_password=attrs['new_password']
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting a password reset.
    
    Sends an email with reset link if the email exists.
    Always succeeds to prevent email enumeration.
    """
    
    email = serializers.EmailField(
        required=True,
        help_text="Email address associated with your account"
    )
    
    def save(self):
        """Send password reset email."""
        from backend.users.services.password_reset import request_password_reset
        request_password_reset(email=self.validated_data['email'])


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming password reset with token.
    
    Verifies the token and sets the new password.
    """
    
    uid = serializers.IntegerField(
        required=True,
        help_text="User ID from reset link"
    )
    token = serializers.CharField(
        required=True,
        help_text="Reset token from email link"
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        help_text="New password (min 8 characters)"
    )
    
    def validate(self, attrs):
        """Verify token and validate new password."""
        from backend.users.services.password_reset import confirm_password_reset
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        try:
            confirm_password_reset(
                user_id=attrs['uid'],
                token=attrs['token'],
                new_password=attrs['new_password']
            )
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            raise serializers.ValidationError({"detail": str(e)})
        
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for logout (token blacklisting).
    
    Accepts a refresh token and blacklists it to prevent further use.
    """
    
    refresh = serializers.CharField(
        required=True,
        help_text="Refresh token to blacklist"
    )
    
    def validate_refresh(self, value):
        """Validate and blacklist the refresh token."""
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        
        try:
            token = RefreshToken(value)
            token.blacklist()
        except TokenError as e:
            raise serializers.ValidationError(str(e))
        
        return value

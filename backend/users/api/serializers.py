"""User domain serializers."""

import os
import uuid
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from backend.users.models import UserMediaType, UserProfile, UserRole
from backend.users.services.create_user import create_user
from backend.users.validators import validate_birthdate

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
    birthdate = serializers.DateField(
        required=True,
        allow_null=False,
        validators=[validate_birthdate],
        help_text="Birthdate collected during registration.",
    )
    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Optional vendor/company name shown in the app.",
    )
    company_code = serializers.CharField(
        max_length=40,
        required=False,
        allow_blank=True,
        help_text="Optional invite code to join an existing company.",
    )

    def create(self, validated_data):
        extra_fields = {
            "company_name": validated_data.get("company_name"),
            "company_code": validated_data.get("company_code"),
            "birthdate": validated_data.get("birthdate"),
        }
        user = create_user(
            username=validated_data.get("username"),
            email=validated_data["email"],
            password=validated_data.get("password"),
            extra_fields={k: v for k, v in extra_fields.items() if v},
        )
        if not user.profile_completed:
            user.profile_completed = True
            user.save(update_fields=["profile_completed"])
        return user


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
    # Convenience read-only field combining first/last name
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "profile_completed",
            "company_name",
            "company_code",
            "company_site",
            "phone_number",
            "birthdate",
            "tos_accepted_at",
            "profile",
        ]
        read_only_fields = ["id", "email", "role", "profile_completed", "tos_accepted_at", "full_name"]

    def get_full_name(self, obj):
        # Use Django's helper to assemble first + last name, fallback to username/email
        try:
            name = obj.get_full_name()
        except Exception:
            name = None
        if name:
            return name
        if obj.username:
            return obj.username
        return obj.email


class UserMediaSerializer(serializers.Serializer):
    """Serializer for user media payloads (avatars, banners, logos)."""

    media_type = serializers.ChoiceField(choices=UserMediaType.choices)
    url = serializers.URLField()
    width = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    height = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    size_kb = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    metadata = serializers.DictField(required=False, default=dict)


class UpdateProfileSerializer(serializers.Serializer):
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
    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="First name",
    )
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Last name",
    )
    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Company/vendor name displayed in the app.",
    )
    company_site = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Public website for the company (optional).",
    )
    company_code = serializers.CharField(
        max_length=40,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Invite code tying this user to a company.",
    )
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Phone number in E.164 format.",
    )
    birthdate = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Birthdate (used for age verification).",
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

    avatar = UserMediaSerializer(required=False, allow_null=True)
    vendor_logo = UserMediaSerializer(required=False, allow_null=True)
    storefront_banner = UserMediaSerializer(required=False, allow_null=True)
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Upload a new profile picture (multipart/form-data).",
    )
    delete_profile_picture = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Set to true to delete the existing profile picture.",
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
    
    def validate(self, attrs):
        """Prevent sending both upload and delete flags together."""
        if attrs.get("delete_profile_picture") and attrs.get("profile_picture"):
            raise serializers.ValidationError(
                {"profile_picture": "Cannot upload and delete the profile picture in the same request."}
            )
        return super().validate(attrs)

    def update(self, instance, validated_data):
        """Update user profile via service layer."""
        from backend.users.services.update_user_profile import update_user_profile

        vendor_id = validated_data.get("vendor_id")
        profile_picture_provided = "profile_picture" in validated_data
        profile_picture_file = validated_data.pop("profile_picture", None)
        delete_picture = validated_data.pop("delete_profile_picture", False)

        service_kwargs = dict(
            user_id=instance.id,
            username=validated_data.get("username"),
            email=validated_data.get("email"),
            first_name=validated_data.get("first_name"),
            last_name=validated_data.get("last_name"),
            company_name=validated_data.get("company_name"),
            company_code=validated_data.get("company_code"),
            company_site=validated_data.get("company_site"),
            phone_number=validated_data.get("phone_number"),
            birthdate=validated_data.get("birthdate"),
            phone=validated_data.get("phone"),
            bio=validated_data.get("bio"),
            vendor_id=vendor_id if vendor_id else None,
            clear_vendor=vendor_id is None and "vendor_id" in validated_data,
        )

        # Handle media uploads/deletes
        if delete_picture:
            self._delete_existing_profile_picture(instance)
            service_kwargs["delete_profile_picture"] = True
        elif profile_picture_file is not None:
            new_url = self._store_profile_picture(profile_picture_file)
            self._delete_existing_profile_picture(instance)
            service_kwargs["profile_picture"] = new_url
        elif profile_picture_provided and profile_picture_file is None:
            # Explicit null upload should behave like deleting the current picture.
            self._delete_existing_profile_picture(instance)
            service_kwargs["delete_profile_picture"] = True

        for field in ("avatar", "vendor_logo", "storefront_banner"):
            if field in validated_data:
                service_kwargs[field] = validated_data[field]

        updated_user = update_user_profile(**service_kwargs)
        return updated_user

    # --- Helpers ---------------------------------------------------------
    def _store_profile_picture(self, uploaded_file):
        """Persist uploaded file via configured storage backend and return a public URL."""
        ext = Path(uploaded_file.name or "").suffix or ".png"
        filename = f"profile_pictures/{uuid.uuid4().hex}{ext}"
        stored_name = default_storage.save(filename, uploaded_file)
        storage_url = default_storage.url(stored_name)

        if not storage_url.lower().startswith(("http://", "https://")):
            request = self.context.get("request")
            if request is not None:
                storage_url = request.build_absolute_uri(storage_url)
            else:
                base = getattr(settings, "EXTERNAL_URL", "").rstrip("/")
                if base:
                    storage_url = f"{base}{storage_url}"

        return storage_url

    def _delete_existing_profile_picture(self, instance):
        """Remove the previous profile picture file from storage if it belongs to us."""
        profile = self._ensure_profile(instance)
        url = profile.profile_picture
        if not url:
            return
        storage_name = self._extract_storage_name(url)
        if not storage_name:
            return
        try:
            default_storage.delete(storage_name)
        except Exception:
            # Ignore deletion errors so profile updates still succeed.
            return

    def _ensure_profile(self, instance):
        """Return or create the user's profile."""
        try:
            return instance.profile
        except UserProfile.DoesNotExist:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            return profile

    def _extract_storage_name(self, url: str) -> str | None:
        """Convert a public URL into the internal storage name for deletion."""
        parsed = urlparse(url)
        path = parsed.path.lstrip("/")
        if not path:
            return None

        media_prefix = settings.MEDIA_URL.lstrip("/")
        if media_prefix and path.startswith(media_prefix):
            path = path[len(media_prefix):].lstrip("/")

        bucket = os.environ.get("SUPABASE_STORAGE_BUCKET")
        supabase_prefix = f"storage/v1/object/public/{bucket}/" if bucket else None
        if supabase_prefix and path.startswith(supabase_prefix.lstrip("/")):
            path = path[len(supabase_prefix.lstrip("/")):]

        return path or None


class CompleteProfileSerializer(serializers.Serializer):
    """
    Serializer used during onboarding to capture the rest of the user's profile details.
    """

    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    company_site = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    company_code = serializers.CharField(max_length=40, required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    birthdate = serializers.DateField(required=False, allow_null=True)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)

    def validate_username(self, value):
        user = self.context["request"].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        from backend.users.services.update_user_profile import update_user_profile

        updated_user = update_user_profile(
            user_id=user.id,
            username=self.validated_data.get("username"),
            password=self.validated_data.get("password"),
            company_name=self.validated_data.get("company_name"),
            company_site=self.validated_data.get("company_site"),
            company_code=self.validated_data.get("company_code"),
            phone_number=self.validated_data.get("phone_number"),
            birthdate=self.validated_data.get("birthdate"),
            mark_profile_completed=True,
        )

        if self.validated_data.get("role"):
            updated_user.role = self.validated_data["role"]
            updated_user.save(update_fields=["role"])

        return updated_user



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
        from django.core.exceptions import ValidationError as DjangoValidationError

        from backend.users.services.change_password import change_password
        
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
        from django.core.exceptions import ValidationError as DjangoValidationError

        from backend.users.services.password_reset import confirm_password_reset
        
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
        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import RefreshToken
        
        try:
            token = RefreshToken(value)
            token.blacklist()
        except TokenError as e:
            raise serializers.ValidationError(str(e))
        
        return value
    
class CheckEmailExistsSerializer(serializers.Serializer):
    """
    Serializer to check if an email is already registered.
    
    Used for client-side validation during registration.
    """
    
    email = serializers.EmailField(
        required=True,
        help_text="Email address to check"
    )
    
    def save(self):
        """Check if email exists in the system."""
        exists = User.objects.filter(email__iexact=self.validated_data['email']).exists()
        return {'available': not exists}

__all__ = [
    "RegisterSerializer",
    "UserProfileSerializer",
    "CurrentUserSerializer",
    "UpdateProfileSerializer",
    "CompleteProfileSerializer",
    "ChangePasswordSerializer",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "LogoutSerializer",
    "CheckEmailExistsSerializer",
]

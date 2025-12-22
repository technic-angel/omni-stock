"""User domain models."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from backend.users.validators import validate_birthdate, validate_phone_number

class UserRole(models.TextChoices):
    """Predefined user roles."""

    ADMIN = "admin", "Administrator"
    VENDOR_MANAGER = "vendor_manager", "Vendor Manager"
    STAFF = "staff", "Staff"
    SOLO = "solo", "Solo"
    VIEWER = "viewer", "Viewer"

class User(AbstractUser):
    """Custom user model with unique email requirement."""

    email = models.EmailField("email address", unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.SOLO,
        help_text="Controls the user's permissions within a company.",
    )
    profile_completed = models.BooleanField(
        default=False,
        help_text="Indicates whether the user has finished the onboarding form.",
    )
    company_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Display name for the vendor or company.",
    )
    company_code = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        help_text="Optional invite code to link this user to an existing company.",
    )
    company_site = models.URLField(
        blank=True,
        null=True,
        help_text="Public website for the company (optional).",
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[validate_phone_number],
        help_text="Contact phone number in E.164 format.",
    )
    birthdate = models.DateField(
        blank=True,
        null=True,
        validators=[validate_birthdate],
        help_text="Birthdate (used for age verification).",
    )
    tos_accepted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when the user accepted terms of service.",
    )

    def __str__(self) -> str:
        if self.username:
            return self.username
        return self.email


class UserProfile(models.Model):
    """Attach vendor metadata and contact info to a Django user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    phone = models.CharField(max_length=40, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.URLField(
        blank=True,
        null=True,
        help_text="User's profile picture URL (stored in Supabase)",
    )
    metadata = models.TextField(
        blank=True,
        null=True,
        help_text="Arbitrary profile metadata (JSON string ok).",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile for {self.user.username}"

class UserMediaType(models.TextChoices):
    """Predefined media types for user-uploaded files."""

    PROFILE_AVATAR = "profile_avatar", "Profile Avatar"
    VENDOR_LOGO = "vendor_logo", "Vendor Logo"
    STOREFRONT_BANNER = "storefront_banner", "Storefront Banner"
    USER_BANNER = "user_banner", "User Banner"

class UserMedia(models.Model):
    """Model to store user-uploaded media files."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="media_files",
    )
    
    media_type = models.CharField(max_length=32, choices=UserMediaType.choices)

    url = models.URLField(
        help_text="URL of the uploaded media file.",
    )   

    width = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Width of the media in pixels (if applicable).",
    )

    height = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Height of the media in pixels (if applicable).",
    )

    size_kb = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Size of the media file in kilobytes.",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about the media",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_media_type_display()} for {self.user.username}"


__all__ = ["User", "UserProfile", "UserMedia"]

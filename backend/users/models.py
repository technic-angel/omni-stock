"""User domain models."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from backend.users.validators import (
    validate_birthdate,
    validate_image_file,
    validate_phone_number,
    validate_profile_picture_size,
)
from backend.vendors.models import Vendor


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
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="users",
    )
    phone = models.CharField(max_length=40, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True,
        validators=[validate_image_file, validate_profile_picture_size],
        help_text="User's profile picture (max 5MB, JPEG/PNG/GIF/WebP only)",
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


__all__ = ["User", "UserProfile"]

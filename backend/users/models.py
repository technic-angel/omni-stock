"""User domain models."""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from backend.vendors.models import Vendor


class User(AbstractUser):
    """Custom user model with unique email requirement."""

    email = models.EmailField("email address", unique=True)

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

"""Vendor domain models."""

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class VendorMemberRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MEMBER = "member", "Member"
    BILLING = "billing", "Billing"
    VIEWER = "viewer", "Viewer"


class Vendor(models.Model):
    """Represents a vendor (shop/account) that owns inventory."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    contact_info = models.TextField(
        blank=True,
        null=True,
        help_text="Free-form contact metadata (JSON string ok).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        ordering = ["name"]
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "vendor"
            slug = base
            i = 1
            while Vendor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


__all__ = ["Vendor"]


class VendorMember(models.Model):
    """Links a `User` to a `Vendor` with a role and membership metadata."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_memberships",
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="members",
    )
    role = models.CharField(max_length=32, choices=VendorMemberRole.choices, default=VendorMemberRole.MEMBER)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    invite_code = models.CharField(max_length=100, blank=True, null=True)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        app_label = "collectibles"
        unique_together = ("vendor", "user")
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user} @ {self.vendor} ({self.role})"


__all__ = ["Vendor", "VendorMember"]

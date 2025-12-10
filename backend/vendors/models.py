"""Vendor domain models."""

from django.conf import settings
from django.db import models
from django.utils.text import slugify


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


class VendorMemberRole(models.TextChoices):
    """Roles within a vendor before store-level permissions kick in."""

    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    STAFF = "staff", "Staff"
    SOLO = "solo", "Solo"


class VendorMember(models.Model):
    """Placeholder membership table so users can belong to multiple vendors."""

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="members",
        blank=True,
        null=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_memberships",
        blank=True,
        null=True,
    )
    role = models.CharField(
        max_length=32,
        choices=VendorMemberRole.choices,
        default=VendorMemberRole.SOLO,
        help_text="High-level vendor role used for invitations and permissions.",
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional title shown in team rosters.",
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="vendor_invites_sent",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        verbose_name = "Vendor Member"
        verbose_name_plural = "Vendor Members"
        indexes = [
            models.Index(fields=("vendor", "role")),
        ]

    def __str__(self):
        if self.vendor and self.user:
            return f"{self.user} -> {self.vendor} ({self.role})"
        return f"VendorMember<{self.pk}>"


class StoreType(models.TextChoices):
    """Basic store types; more granular rules come later stages."""

    ONLINE = "online", "Online"
    RETAIL = "retail", "Retail"
    POPUP = "popup", "Pop-up"
    WAREHOUSE = "warehouse", "Warehouse"


class Store(models.Model):
    """Represents a physical or digital store owned by a vendor."""

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="stores",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    type = models.CharField(
        max_length=32,
        choices=StoreType.choices,
        blank=True,
        null=True,
    )
    description = models.TextField(blank=True, null=True)
    address = models.TextField(
        blank=True,
        null=True,
        help_text="Optional physical address or pickup notes.",
    )
    metadata = models.JSONField(default=dict, blank=True)
    logo_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        verbose_name = "Store"
        verbose_name_plural = "Stores"
        unique_together = ("vendor", "slug")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "store"
            slug = base
            i = 1
            qs = Store.objects.all()
            if self.vendor_id:
                qs = qs.filter(vendor_id=self.vendor_id)
            else:
                qs = qs.filter(vendor__isnull=True)
            while qs.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class StoreAccessRole(models.TextChoices):
    """Store-scoped roles layered on top of vendor membership."""

    MANAGER = "manager", "Manager"
    SALES = "sales", "Sales"
    VIEW_ONLY = "view_only", "View Only"


class StoreAccess(models.Model):
    """
    Grants a vendor member access to a specific store with optional overrides.
    """

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name="access_grants",
    )
    member = models.ForeignKey(
        VendorMember,
        on_delete=models.CASCADE,
        related_name="store_accesses",
    )
    role = models.CharField(
        max_length=32,
        choices=StoreAccessRole.choices,
        default=StoreAccessRole.SALES,
    )
    permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom overrides (e.g., can_adjust_price).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        verbose_name = "Store Access"
        verbose_name_plural = "Store Access"
        unique_together = ("store", "member")

    def __str__(self):
        return f"{self.member} @ {self.store} ({self.role})"


__all__ = [
    "Vendor",
    "VendorMember",
    "VendorMemberRole",
    "Store",
    "StoreType",
    "StoreAccess",
    "StoreAccessRole",
]

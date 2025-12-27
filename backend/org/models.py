"""Vendor domain models."""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class VendorMemberRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    MEMBER = "member", "Member"
    STAFF = "staff", "Staff"
    BILLING = "billing", "Billing"
    VIEWER = "viewer", "Viewer"

    @classmethod
    def admin_roles(cls):
        return {cls.OWNER, cls.ADMIN}


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
        db_table = "org_vendor"

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


class VendorMember(models.Model):
    """Links a `User` to a `Vendor` with a role and membership metadata."""

    class InviteStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        REVOKED = "revoked", "Revoked"

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
    role = models.CharField(
        max_length=32,
        choices=VendorMemberRole.choices,
        default=VendorMemberRole.MEMBER,
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional display title for rosters (e.g., Lead Buyer).",
    )
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    invite_status = models.CharField(
        max_length=20,
        choices=InviteStatus.choices,
        default=InviteStatus.PENDING,
        help_text="Lifecycle state for invitations and membership activation.",
    )
    invited_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(blank=True, null=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    invite_code = models.CharField(max_length=100, blank=True, null=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="vendor_invites_sent",
        blank=True,
        null=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    active_store = models.ForeignKey(
        "Store",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="active_members",
        help_text="Last store selected by this member for the vendor.",
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Marks this membership as the user's currently selected vendor.",
    )

    class Meta:
        app_label = "collectibles"
        unique_together = ("vendor", "user")
        ordering = ["vendor_id", "user_id"]
        db_table = "org_membership"
        indexes = [
            models.Index(fields=["vendor", "user", "is_active"]),
            models.Index(fields=["user", "is_primary"]),
        ]

    def __str__(self):
        return f"{self.user} @ {self.vendor} ({self.role})"


class StoreType(models.TextChoices):
    RETAIL = "retail", "Retail"
    ONLINE = "online", "Online"
    POPUP = "popup", "Pop-up"
    WAREHOUSE = "warehouse", "Warehouse"


class Store(models.Model):
    """Represents an individual storefront or channel for a vendor."""

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="stores",
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
    address = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    logo_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    currency = models.CharField(max_length=8, blank=True, null=True)
    default_tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        unique_together = ("vendor", "slug")
        ordering = ["name"]
        db_table = "org_store"
        indexes = [
            models.Index(fields=["vendor", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.vendor})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "store"
            slug = base
            i = 1
            qs = Store.objects.filter(vendor=self.vendor)
            while qs.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class StoreAccessRole(models.TextChoices):
    MANAGER = "manager", "Manager"
    SALES = "sales", "Sales"
    VIEW_ONLY = "view_only", "View Only"


class StoreAccess(models.Model):
    """Grant a vendor member scoped access to an individual store."""

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name="access",
    )
    member = models.ForeignKey(
        VendorMember,
        on_delete=models.CASCADE,
        related_name="store_access",
    )
    role = models.CharField(
        max_length=32,
        choices=StoreAccessRole.choices,
        default=StoreAccessRole.SALES,
    )
    permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Optional custom overrides (e.g., can_adjust_price).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "collectibles"
        unique_together = ("store", "member")
        ordering = ["store_id", "member_id"]
        db_table = "org_store_access"

    def __str__(self):
        return f"{self.member} -> {self.store} ({self.role})"


__all__ = [
    "Vendor",
    "VendorMember",
    "VendorMemberRole",
    "Store",
    "StoreType",
    "StoreAccess",
    "StoreAccessRole",
]

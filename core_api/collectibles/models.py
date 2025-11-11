from django.db import models
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings


class Vendor(models.Model):
    """A vendor/shop that owns inventory items.

    We keep this intentionally small for now. Vendors may be soft-disabled
    later via an `is_active` flag.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class UserProfile(models.Model):
    """Small extension to Django's User model for vendor-scoped roles."""

    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_EMPLOYEE = 'employee'
    ROLE_CHOICES = (
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_EMPLOYEE, 'Employee'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class Collectible(models.Model):
    """Represents a single stockable item in the inventory."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The user who created or manages this inventory item.",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The vendor/shop this item belongs to.",
    )

    # Identification
    name = models.CharField(max_length=255, help_text="The common name of the collectible item.")
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit (Unique Identifier).")

    # Location and media
    location = models.CharField(max_length=100, blank=True, null=True, help_text="Physical location (e.g., 'Binder 3').")
    image = models.ImageField(upload_to='collectibles_images/', blank=True, null=True, help_text="Image of the collectible item.")

    # External references and metadata
    external_refs = models.JSONField(default=dict, blank=True, null=True, help_text="External identifiers and metadata")

    # Condition/grade fields useful for cards
    condition = models.CharField(max_length=64, blank=True, null=True, help_text="Condition (e.g., Near Mint)")
    grade = models.CharField(max_length=64, blank=True, null=True, help_text="Grading company and grade (if applicable)")

    # Tracking
    quantity = models.IntegerField(default=0, help_text="Current number of units in stock.")
    last_updated = models.DateTimeField(auto_now=True)

    # Pricing
    intake_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Cost basis")
    current_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Current market value or selling price")
    projected_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Projected price based on market trends")

    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Collectible Item"
        verbose_name_plural = "Collectible Items"
        ordering = ['name']

    def __str__(self) -> str:
        return f"[{self.sku}] {self.name} ({self.quantity} in stock)"


class CardDetails(models.Model):
    """Additional card-specific metadata stored separately from general collectibles.

    This keeps the main `Collectible` model generic and allows other collectible
    types later.
    """

    CONDITION_NEW = 'new'
    CONDITION_LIKE_NEW = 'like_new'
    CONDITION_VERY_GOOD = 'very_good'
    CONDITION_GOOD = 'good'
    CONDITION_POOR = 'poor'
    CONDITION_OTHER = 'other'

    CONDITION_CHOICES = (
        (CONDITION_NEW, 'New'),
        (CONDITION_LIKE_NEW, 'Like New'),
        (CONDITION_VERY_GOOD, 'Very Good'),
        (CONDITION_GOOD, 'Good'),
        (CONDITION_POOR, 'Poor'),
        (CONDITION_OTHER, 'Other'),
    )

    collectible = models.OneToOneField(Collectible, on_delete=models.CASCADE, related_name='card_details')
    set_name = models.CharField(max_length=255, blank=True, null=True)
    set_code = models.CharField(max_length=50, blank=True, null=True)
    year = models.PositiveIntegerField(blank=True, null=True)
    edition = models.CharField(max_length=128, blank=True, null=True)
    card_number = models.CharField(max_length=64, blank=True, null=True)

    # PSA grade stored as an integer 1..10 when graded; null if ungraded
    psa_grade = models.PositiveSmallIntegerField(blank=True, null=True)

    condition = models.CharField(max_length=32, choices=CONDITION_CHOICES, blank=True, null=True)

    # Optional external ids (e.g., TCGplayer id, eBay item id, etc.)
    external_ids = models.JSONField(default=dict, blank=True, null=True)

    # When we last computed/estimated price for this card
    last_estimated_at = models.DateTimeField(blank=True, null=True)

    def __str__(self) -> str:
        return f"CardDetails for {self.collectible.sku}"

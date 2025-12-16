"""Inventory domain models."""

from django.conf import settings
from django.db import models

from backend.vendors.models import Store, Vendor


class Collectible(models.Model):
    """Represents a single stockable inventory item."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The user/vendor who owns this inventory item.",
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collectibles",
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name="collectibles",
        help_text="Store that currently stocks this item.",
    )
    name = models.CharField(max_length=255, help_text="The common name of the collectible item.")
    sku = models.CharField(
        max_length=50,
        unique=True,
        help_text="Stock Keeping Unit (Unique Identifier).",
    )
    description = models.TextField(blank=True, null=True)
    condition = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Human-readable condition (e.g., Mint, Near Mint).",
    )
    category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="High-level category (e.g., TCG, Video Games, Collectibles).",
    )
    image_url = models.URLField(blank=True, null=True, help_text="Public image URL stored in Supabase.")
    quantity = models.IntegerField(default=0, help_text="Current number of units in stock.")
    intake_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="The price paid for the item (cost basis).",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="The current market value or selling price.",
    )
    projected_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="The projected price based on market trends.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Collectible Item"
        verbose_name_plural = "Collectible Items"
        ordering = ["name"]

    def __str__(self):
        return f"[{self.sku}] {self.name} ({self.quantity} in stock)"


class CardDetails(models.Model):
    """
    Card-specific metadata kept separate from the main Collectible row.
    OneToOne with Collectible so admin can inline it and APIs can nest it.
    """

    collectible = models.OneToOneField(
        Collectible,
        on_delete=models.CASCADE,
        related_name="card_details",
    )
    psa_grade = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        blank=True,
        null=True,
        help_text="Numeric grade, e.g. 8.5 or 10.0",
    )
    condition = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Human-readable condition (e.g., Mint, Near Mint).",
    )
    external_ids = models.TextField(
        blank=True,
        null=True,
        help_text="JSON string of external IDs (portable across DBs)",
    )
    last_estimated_at = models.DateTimeField(blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    print_run = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Optional print run or edition info.",
    )
    market_region = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes about the card",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Card Details"
        verbose_name_plural = "Card Details"

    def __str__(self):
        from django.core.exceptions import ObjectDoesNotExist

        try:
            sku = getattr(self.collectible, "sku", None)
        except ObjectDoesNotExist:
            sku = None

        if sku:
            return f"CardDetails for {sku}"
        if self.pk:
            return f"CardDetails for {self.pk}"
        return "CardDetails (unsaved)"

    def get_external_ids(self):
        """Return external_ids as a dict if possible, otherwise empty dict."""
        import json

        if not self.external_ids:
            return {}
        try:
            return json.loads(self.external_ids)
        except Exception:
            return {}

    def set_external_ids(self, data):
        """Set external_ids from a dict or JSON-serializable object."""
        import json

        try:
            self.external_ids = json.dumps(data)
        except Exception:
            self.external_ids = None

class InventoryMediaType(models.TextChoices):
    PRIMARY = "primary", "Primary Image"
    GALLERY = "gallery", "Gallery Image"

class InventoryMedia(models.Model):
    """Media files (images) associated with inventory items."""

    item = models.ForeignKey(
        Collectible,
        on_delete=models.CASCADE,
        related_name="media",
    )
    
    url = models.URLField(
        help_text="Public URL of the media file."
        )
    
    media_type = models.CharField(
        max_length=32,
        choices=InventoryMediaType.choices,
        default=InventoryMediaType.GALLERY,
        help_text="Classify this media (primary vs gallery).",
    )
    
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order of media files for display purposes.",
    )

    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this media is the primary display image.",
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

    class Meta:
        unique_together = ("item", "sort_order")

    def __str__(self):
        return f"{self.item.sku} media ({self.get_media_type_display()})"


class StockLedger(models.Model):
    """Track inventory movements between stores."""

    collectible = models.ForeignKey(
        Collectible,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    from_store = models.ForeignKey(
        Store,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_out",
    )
    to_store = models.ForeignKey(
        Store,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_in",
    )
    delta = models.IntegerField(help_text="Quantity change (positive or negative).")
    reason = models.CharField(max_length=64, blank=True, null=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_actions",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.collectible_id} delta {self.delta}"


__all__ = ["Collectible", "CardDetails", "InventoryMedia", "StockLedger"]

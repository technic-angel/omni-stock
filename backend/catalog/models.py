"""Inventory domain models."""

from django.conf import settings
from django.db import models

from backend.org.models import Store, Vendor


class Era(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    start_year = models.IntegerField(null=True, blank=True)
    end_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name


class Set(models.Model):
    era = models.ForeignKey(Era, on_delete=models.CASCADE, related_name="sets")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, help_text="e.g. SWSH01")
    release_date = models.DateField(null=True, blank=True)
    card_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Product(models.Model):
    PRODUCT_TYPES = [
        ("booster_pack", "Booster Pack"),
        ("booster_box", "Booster Box"),
        ("etb", "Elite Trainer Box"),
        ("theme_deck", "Theme Deck"),
        ("tin", "Tin"),
        ("other", "Other"),
    ]
    set = models.ForeignKey(
        Set, on_delete=models.CASCADE, related_name="products", null=True, blank=True
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=PRODUCT_TYPES)
    configuration = models.JSONField(default=dict, blank=True)
    release_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


class Accessory(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, help_text="e.g. Binder, Sleeve, Deck Box")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Accessories"

    def __str__(self):
        return self.name


class CatalogItem(models.Model):
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
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="collectibles",
        help_text="The retail product this item came from (optional).",
    )
    name = models.CharField(max_length=255, help_text="The common name of the collectible item.")
    sku = models.CharField(
        max_length=50,
        unique=True,
        help_text="Stock Keeping Unit (Unique Identifier).",
    )
    description = models.TextField(blank=True, null=True)
    search_text = models.TextField(
        blank=True,
        db_index=True,
        help_text="Denormalized search field (name + sku + description).",
    )
    condition = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Human-readable condition (e.g., Mint, Near Mint).",
    )
    category = models.CharField(
        max_length=100,
        choices=[
            ("pokemon_card", "Pokémon Card"),
            ("clothing", "Clothing"),
            ("video_game", "Video Game"),
            ("other", "Other Collectible"),
        ],
        blank=True,
        null=True,
        help_text="High-level category used for polymorphic attributes.",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("low_stock", "Low Stock"),
            ("archived", "Archived"),
        ],
        default="active",
        help_text="Lifecycle flag for quick filtering (UI + reports).",
        db_index=True,
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
        verbose_name = "Catalog Item"
        verbose_name_plural = "Catalog Items"
        ordering = ["name"]
        db_table = "catalog_item"
        indexes = [
            models.Index(fields=["vendor", "store"]),
            models.Index(fields=["vendor", "category"]),
            models.Index(fields=["store", "category"]),
            models.Index(fields=["name"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["search_text"]),
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["vendor", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.sku}] {self.name} ({self.quantity} in stock)"

    @property
    def card_details(self):
        """Backward compatible alias for card_metadata."""
        return getattr(self, "card_metadata", None)

    @classmethod
    def update_search_text(cls, instance):
        """Denormalize fields into search_text for fast icontains filters."""
        parts = [
            instance.name or "",
            instance.sku or "",
            instance.description or "",
            instance.category or "",
        ]
        instance.search_text = " ".join(part for part in parts if part).strip()

    def save(self, *args, **kwargs):
        self.update_search_text(self)
        super().save(*args, **kwargs)


class CatalogVariant(models.Model):
    """Variants capture per-condition/grade inventory splits."""

    item = models.ForeignKey(
        CatalogItem,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    condition = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Condition label for this variant (e.g., PSA 10, Raw).",
    )
    grade = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Optional grading authority label.",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Optional variant-specific price override.",
    )
    media = models.ManyToManyField(
        "CatalogMedia",
        blank=True,
        related_name="variants",
        help_text="Optional images tied to this variant/condition.",
    )
    quantity = models.PositiveIntegerField(default=0)
    price_adjustment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Adjustment applied relative to the base item price.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_variant"
        unique_together = ("item", "condition", "grade")

    def __str__(self):
        label = self.condition or self.grade or "Variant"
        return f"{self.item.sku} - {label}"


class CardMetadata(models.Model):
    """
    Card-specific metadata kept separate from the main CatalogItem row.
    OneToOne with CatalogItem so admin can inline it and APIs can nest it.
    """

    item = models.OneToOneField(
        CatalogItem,
        on_delete=models.CASCADE,
        related_name="card_metadata",
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
    set_name = models.CharField(max_length=255, blank=True, null=True)
    card_number = models.CharField(max_length=20, blank=True, null=True)
    rarity = models.CharField(
        max_length=50,
        choices=[
            ("common", "Common"),
            ("uncommon", "Uncommon"),
            ("rare", "Rare"),
            ("ultra_rare", "Ultra Rare"),
            ("secret_rare", "Secret Rare"),
        ],
        blank=True,
        null=True,
    )
    finish = models.CharField(
        max_length=50,
        choices=[
            ("non_holo", "Non-Holo"),
            ("holo", "Holo"),
            ("reverse_holo", "Reverse Holo"),
            ("full_art", "Full Art"),
        ],
        blank=True,
        null=True,
    )
    size = models.CharField(max_length=20, blank=True, null=True)
    color = models.CharField(max_length=100, blank=True, null=True)
    material = models.CharField(max_length=255, blank=True, null=True)
    brand = models.CharField(max_length=255, blank=True, null=True)
    platform = models.CharField(
        max_length=50,
        choices=[
            ("nintendo_switch", "Nintendo Switch"),
            ("ps5", "PlayStation 5"),
            ("xbox_series_x", "Xbox Series X"),
            ("pc", "PC"),
            ("retro", "Retro"),
            ("handheld", "Handheld"),
        ],
        blank=True,
        null=True,
    )
    game_region = models.CharField(
        max_length=50,
        choices=[
            ("ntsc_u", "NTSC-U"),
            ("ntsc_j", "NTSC-J"),
            ("pal", "PAL"),
            ("region_free", "Region Free"),
        ],
        blank=True,
        null=True,
    )
    completeness = models.CharField(
        max_length=50,
        choices=[
            ("loose", "Loose"),
            ("cib", "CIB"),
            ("sealed", "Sealed"),
            ("box_manual", "Box & Manual"),
        ],
        blank=True,
        null=True,
    )
    game_genre = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Card Metadata"
        verbose_name_plural = "Card Metadata"
        db_table = "catalog_card_metadata"

    def __str__(self):
        from django.core.exceptions import ObjectDoesNotExist

        try:
            sku = getattr(self.item, "sku", None)
        except ObjectDoesNotExist:
            sku = None

        if sku:
            return f"CardMetadata for {sku}"
        if self.pk:
            return f"CardMetadata for {self.pk}"
        return "CardMetadata (unsaved)"

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

class CatalogMediaType(models.TextChoices):
    PRIMARY = "primary", "Primary Image"
    GALLERY = "gallery", "Gallery Image"

class CatalogMedia(models.Model):
    """Media files (images) associated with inventory items."""

    item = models.ForeignKey(
        CatalogItem,
        on_delete=models.CASCADE,
        related_name="media",
    )
    
    url = models.URLField(
        help_text="Public URL of the media file."
        )
    
    media_type = models.CharField(
        max_length=32,
        choices=CatalogMediaType.choices,
        default=CatalogMediaType.GALLERY,
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
        db_table = "catalog_media"

    def __str__(self):
        return f"{self.item.sku} media ({self.get_media_type_display()})"


class StockLedger(models.Model):
    """Track inventory movements for auditing and sales history."""

    TRANSACTION_TYPES = [
        ("add", "Added to Inventory"),
        ("remove", "Removed from Inventory"),
        ("adjustment", "Adjustment"),
        ("sale", "Sold"),
        ("transfer", "Transferred"),
        ("write_off", "Write Off"),
    ]

    item = models.ForeignKey(
        CatalogItem,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
        default="adjustment",
    )
    quantity_before = models.IntegerField(default=0)
    quantity_after = models.IntegerField(default=0)
    quantity_delta = models.IntegerField(
        default=0,
        help_text="Positive for adds, negative for removals.",
    )
    reason = models.TextField(blank=True, null=True)
    related_sale_id = models.IntegerField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_ledger_entries",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["item", "created_at"]),
            models.Index(fields=["transaction_type", "created_at"]),
        ]

    def __str__(self):
        return f"{self.item_id} {self.transaction_type} {self.quantity_delta}"


__all__ = ["CatalogItem", "CatalogVariant", "CardMetadata", "CatalogMedia", "StockLedger"]

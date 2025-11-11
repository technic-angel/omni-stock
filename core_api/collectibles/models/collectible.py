from django.db import models
from django.conf import settings


class Collectible(models.Model):
    """
    Represents a single stockable item in the inventory.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The user/vendor who owns this inventory item."
    )

    vendor = models.ForeignKey('collectibles.Vendor', on_delete=models.SET_NULL, null=True, blank=True, related_name='collectibles')

    name = models.CharField(max_length=255, help_text="The common name of the collectible item.")
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit (Unique Identifier).")

    location = models.CharField(max_length=100, blank=True, null=True, help_text="Physical location (e.g., 'Binder 3', 'Shelf A')")

    image = models.ImageField(upload_to='collectibles_images/', blank=True, null=True, help_text="Image of the collectible item.")

    quantity = models.IntegerField(default=0, help_text="Current number of units in stock.")
    last_updated = models.DateTimeField(auto_now=True)

    intake_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="The price paid for the item (cost basis).")
    current_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="The current market value or selling price.")
    projected_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="The projected price based on market trends.")

    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Collectible Item"
        verbose_name_plural = "Collectible Items"
        ordering = ['name']

    def __str__(self):
        return "[{sku}] {name} ({qty} in stock)".format(sku=self.sku, name=self.name, qty=self.quantity)

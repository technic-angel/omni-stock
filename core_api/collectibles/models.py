from django.db import models

class Collectible(models.Model):
    """
    Represents a single stockable item in the inventory.
    """
    # Basic Identification Fields
    name = models.CharField(max_length=255, help_text="The common name of the collectible item.")
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit (Unique Identifier).")

    # Tracking Fields
    quantity = models.IntegerField(default=0, help_text="Current number of units in stock.")
    last_updated = models.DateTimeField(auto_now=True)

    # Optional Detail Fields
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Collectible Item"
        verbose_name_plural = "Collectible Items"
        ordering = ['name']

    def __str__(self):
        return f"[{self.sku}] {self.name} ({self.quantity} in stock)"
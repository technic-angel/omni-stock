from django.db import models


class CardDetails(models.Model):
    """
    Card-specific metadata kept separate from the main Collectible row.
    OneToOne with Collectible so admin can inline it and APIs can nest it.
    """
    collectible = models.OneToOneField('collectibles.Collectible', on_delete=models.CASCADE, related_name='card_details')
    # Grading / condition
    psa_grade = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True, help_text="Numeric grade, e.g. 8.5 or 10.0")
    condition = models.CharField(max_length=50, blank=True, null=True, help_text="Human-readable condition (e.g., Mint, Near Mint).")
    external_ids = models.TextField(blank=True, null=True, help_text='JSON string of external IDs (portable across DBs)')
    last_estimated_at = models.DateTimeField(blank=True, null=True)

    # Release metadata (language & market)
    language = models.CharField(max_length=50, blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    print_run = models.CharField(max_length=100, blank=True, null=True, help_text="Optional print run or edition info.")
    market_region = models.CharField(max_length=100, blank=True, null=True)

    # Employee notes
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about the card")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Card Details"
        verbose_name_plural = "Card Details"

    def __str__(self):
        sku = getattr(self.collectible, 'sku', None)
        return f"CardDetails for {sku or self.pk}"

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

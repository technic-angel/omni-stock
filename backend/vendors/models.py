"""Vendor domain models."""

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


__all__ = ["Vendor"]

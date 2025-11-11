from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """
    Lightweight profile to attach business metadata and vendor affiliation to the Django user.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    vendor = models.ForeignKey('collectibles.Vendor', on_delete=models.SET_NULL, blank=True, null=True, related_name="users")
    phone = models.CharField(max_length=40, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    metadata = models.TextField(blank=True, null=True, help_text="Arbitrary profile metadata (JSON string ok).")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

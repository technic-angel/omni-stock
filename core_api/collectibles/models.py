"""Compatibility layer that re-exports domain models."""

from backend.inventory.models import CardDetails, Collectible
from backend.users.models import UserProfile
from backend.vendors.models import Vendor

__all__ = [
    "Collectible",
    "Vendor",
    "UserProfile",
    "CardDetails",
]

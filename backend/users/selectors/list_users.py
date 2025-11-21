"""Selector for listing users."""

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

User = get_user_model()


def list_users() -> QuerySet:
    """Return all users (admin-level use)."""
    return User.objects.all()


__all__ = ["list_users"]

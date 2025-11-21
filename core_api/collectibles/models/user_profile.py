"""Compatibility wrapper for the relocated UserProfile model."""

from backend.users.models import UserProfile  # noqa: F401

__all__ = ["UserProfile"]

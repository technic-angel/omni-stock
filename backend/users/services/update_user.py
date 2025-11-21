"""Service for updating user fields."""

from typing import Any, Dict

from django.contrib.auth import get_user_model

User = get_user_model()


def update_user(*, instance: User, data: Dict[str, Any]) -> User:
    """Update a user instance with provided fields."""
    for attr, value in data.items():
        setattr(instance, attr, value)
    instance.save()
    return instance


__all__ = ["update_user"]

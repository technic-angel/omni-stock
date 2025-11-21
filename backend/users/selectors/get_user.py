"""Selector for retrieving a single user."""

from typing import Any

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()


def get_user(*, user_id: Any) -> User | None:
    """Return the user if it exists, otherwise None."""
    try:
        return User.objects.get(pk=user_id)
    except ObjectDoesNotExist:
        return None


__all__ = ["get_user"]

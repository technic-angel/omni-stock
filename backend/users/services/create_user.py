"""Service for creating users and associated profiles."""

from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.db import transaction

from backend.users.models import UserProfile

User = get_user_model()


def create_user(*, username: str, password: str, email: str | None = None, extra_fields: Dict[str, Any] | None = None) -> User:
    """
    Create a Django user and ensure a UserProfile exists.

    The intent is to centralize User creation logic so serializers and views
    remain thin.
    """
    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email or "",
            **(extra_fields or {}),
        )
        UserProfile.objects.get_or_create(user=user)
    return user


__all__ = ["create_user"]

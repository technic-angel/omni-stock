"""Service for creating users and associated profiles."""

from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.db import transaction

from backend.users.models import UserProfile

User = get_user_model()


def create_user(
    *,
    username: str,
    password: str,
    email: str,
    extra_fields: Dict[str, Any] | None = None,
) -> User:
    """
    Create a Django user and ensure a UserProfile exists.

    The intent is to centralize User creation logic so serializers and views
    remain thin.
    """
    if not email:
        raise ValueError("Email is required for user creation.")

    payload = extra_fields.copy() if extra_fields else {}
    payload["email"] = email

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            password=password,
            **payload,
        )
        UserProfile.objects.get_or_create(user=user)
    return user


__all__ = ["create_user"]

"""Core validators."""

from urllib.parse import urlparse

from django.core.exceptions import ValidationError


def validate_image_url(url: str) -> str:
    """Ensure the provided image URL looks valid (scheme + netloc)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValidationError("Invalid image URL")
    return url


__all__ = ["validate_image_url"]

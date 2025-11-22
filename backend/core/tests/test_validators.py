import pytest

from backend.core.validators import validate_image_url


def test_validate_image_url_happy():
    assert validate_image_url("https://example.com/img.png") == "https://example.com/img.png"


def test_validate_image_url_invalid():
    with pytest.raises(Exception):
        validate_image_url("not-a-url")

"""Tests for file upload validators."""

from datetime import date, timedelta
from io import BytesIO

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from backend.users.validators import (
    MINIMUM_AGE,
    FileSizeValidator,
    ImageFileValidator,
    validate_birthdate,
    validate_image_file,
    validate_phone_number,
    validate_profile_picture_size,
)


def create_test_image(filename="test.jpg", size=(100, 100), color="red", format="JPEG"):
    """Helper to create a test image file."""
    file = BytesIO()
    image = Image.new('RGB', size, color=color)
    image.save(file, format)
    file.seek(0)
    
    content_types = {
        'JPEG': 'image/jpeg',
        'PNG': 'image/png',
        'GIF': 'image/gif',
        'WEBP': 'image/webp',
    }
    
    return SimpleUploadedFile(
        name=filename,
        content=file.read(),
        content_type=content_types.get(format, 'image/jpeg')
    )


def test_file_size_validator_accepts_small_files():
    """Test that FileSizeValidator accepts files under the limit."""
    # ARRANGE
    validator = FileSizeValidator(max_mb=5)
    small_file = create_test_image("small.jpg", size=(50, 50))
    
    # ACT & ASSERT - should not raise
    validator(small_file)


def test_file_size_validator_rejects_large_files():
    """Test that FileSizeValidator rejects files over the limit."""
    # ARRANGE
    validator = FileSizeValidator(max_mb=0.001)  # Tiny limit: 0.001 MB = 1 KB
    large_file = create_test_image("large.jpg", size=(500, 500))
    
    # ACT & ASSERT
    with pytest.raises(ValidationError) as exc_info:
        validator(large_file)
    
    assert "File size must be no more than" in str(exc_info.value)
    assert "0.001MB" in str(exc_info.value)


def test_image_file_validator_accepts_valid_images():
    """Test that ImageFileValidator accepts valid image files."""
    # ARRANGE
    validator = ImageFileValidator()
    
    # ACT & ASSERT - all these should pass
    for format_type in ['JPEG', 'PNG', 'GIF', 'WEBP']:
        ext = format_type.lower() if format_type != 'JPEG' else 'jpg'
        image_file = create_test_image(f"test.{ext}", format=format_type)
        validator(image_file)  # Should not raise


def test_image_file_validator_rejects_invalid_mime_type():
    """Test that ImageFileValidator rejects files with invalid MIME types."""
    # ARRANGE
    validator = ImageFileValidator()
    fake_file = SimpleUploadedFile(
        name="fake.jpg",
        content=b"not an image",
        content_type="application/pdf"  # Wrong MIME type
    )
    
    # ACT & ASSERT
    with pytest.raises(ValidationError) as exc_info:
        validator(fake_file)
    
    assert "Unsupported file type" in str(exc_info.value)


def test_image_file_validator_rejects_invalid_extension():
    """Test that ImageFileValidator rejects files with invalid extensions."""
    # ARRANGE
    validator = ImageFileValidator()
    fake_file = SimpleUploadedFile(
        name="fake.pdf",
        content=b"fake content",
        content_type="image/jpeg"  # Correct MIME but wrong extension
    )
    
    # ACT & ASSERT
    with pytest.raises(ValidationError) as exc_info:
        validator(fake_file)
    
    assert "Unsupported file extension" in str(exc_info.value)


def test_image_file_validator_rejects_corrupted_image():
    """Test that ImageFileValidator rejects corrupted image data."""
    # ARRANGE
    validator = ImageFileValidator()
    corrupted_file = SimpleUploadedFile(
        name="corrupted.jpg",
        content=b"fake image data that is not really an image",
        content_type="image/jpeg"
    )
    
    # ACT & ASSERT
    with pytest.raises(ValidationError) as exc_info:
        validator(corrupted_file)
    
    assert "Invalid image file" in str(exc_info.value)


def test_pre_configured_validators_work():
    """Test that pre-configured validators (validate_image_file, etc) work."""
    # ARRANGE
    valid_image = create_test_image("valid.jpg")
    
    # ACT & ASSERT - should not raise
    validate_image_file(valid_image)
    validate_profile_picture_size(valid_image)


def test_file_size_validator_custom_limit():
    """Test FileSizeValidator with custom size limits."""
    # ARRANGE
    validator_1mb = FileSizeValidator(max_mb=1)
    validator_10mb = FileSizeValidator(max_mb=10)
    medium_file = create_test_image("medium.jpg", size=(200, 200))
    
    # ACT & ASSERT
    validator_1mb(medium_file)  # Should pass (file is small)
    validator_10mb(medium_file)  # Should also pass


def test_image_validator_allows_custom_types():
    """Test ImageFileValidator with custom allowed types."""
    # ARRANGE
    validator = ImageFileValidator(
        allowed_types=['image/png'],
        allowed_extensions=['.png']
    )
    
    png_file = create_test_image("test.png", format='PNG')
    jpg_file = create_test_image("test.jpg", format='JPEG')
    
    # ACT & ASSERT
    validator(png_file)  # Should pass
    
    with pytest.raises(ValidationError):
        validator(jpg_file)  # Should fail (only PNG allowed)


def test_validate_phone_number_enforces_format():
    validate_phone_number("+15551234567")  # should not raise
    validate_phone_number("")  # allow empty
    with pytest.raises(ValidationError):
        validate_phone_number("123-456")  # invalid format


def test_validate_birthdate_checks_age_and_future():
    adult_date = date.today().replace(year=date.today().year - (MINIMUM_AGE + 1))
    validate_birthdate(adult_date)

    with pytest.raises(ValidationError):
        validate_birthdate(date.today() + timedelta(days=1))

    underage_date = date.today().replace(year=date.today().year - (MINIMUM_AGE - 1))
    with pytest.raises(ValidationError):
        validate_birthdate(underage_date)


__all__ = []

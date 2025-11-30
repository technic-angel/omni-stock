"""Validators for user-uploaded files."""

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible


@deconstructible
class FileSizeValidator:
    """
    Validator to check file size.
    
    Usage:
        profile_picture = models.ImageField(
            validators=[FileSizeValidator(max_mb=5)]
        )
    """
    
    def __init__(self, max_mb=5):
        """
        Initialize validator.
        
        Args:
            max_mb: Maximum file size in megabytes (default: 5MB)
        """
        self.max_mb = max_mb
        self.max_bytes = max_mb * 1024 * 1024
    
    def __call__(self, file):
        """
        Validate file size.
        
        Args:
            file: Django UploadedFile object
            
        Raises:
            ValidationError: If file is too large
        """
        if file.size > self.max_bytes:
            raise ValidationError(
                f'File size must be no more than {self.max_mb}MB. '
                f'Current file size: {file.size / (1024 * 1024):.2f}MB'
            )
    
    def __eq__(self, other):
        """Required for migrations."""
        return isinstance(other, FileSizeValidator) and self.max_mb == other.max_mb


@deconstructible
class ImageFileValidator:
    """
    Validator to check file is actually an image.
    
    Usage:
        profile_picture = models.ImageField(
            validators=[ImageFileValidator()]
        )
    """
    
    # Allowed MIME types for images
    ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ]
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    def __init__(self, allowed_types=None, allowed_extensions=None):
        """
        Initialize validator.
        
        Args:
            allowed_types: List of allowed MIME types (optional)
            allowed_extensions: List of allowed file extensions (optional)
        """
        self.allowed_types = allowed_types or self.ALLOWED_MIME_TYPES
        self.allowed_extensions = allowed_extensions or self.ALLOWED_EXTENSIONS
    
    def __call__(self, file):
        """
        Validate file is an image.
        
        Args:
            file: Django UploadedFile object
            
        Raises:
            ValidationError: If file is not a valid image
        """
        # Check MIME type
        if hasattr(file, 'content_type') and file.content_type:
            if file.content_type not in self.allowed_types:
                raise ValidationError(
                    f'Unsupported file type: {file.content_type}. '
                    f'Allowed types: {", ".join(self.allowed_types)}'
                )
        
        # Check file extension
        if hasattr(file, 'name') and file.name:
            file_ext = file.name.lower()
            if not any(file_ext.endswith(ext) for ext in self.allowed_extensions):
                raise ValidationError(
                    f'Unsupported file extension. '
                    f'Allowed extensions: {", ".join(self.allowed_extensions)}'
                )
        
        # Try to validate it's actually an image using Pillow
        try:
            from PIL import Image
            file.seek(0)  # Reset file pointer
            image = Image.open(file)
            image.verify()  # Verify it's a valid image
            file.seek(0)  # Reset file pointer again for Django to use
        except Exception as e:
            raise ValidationError(
                f'Invalid image file. The file may be corrupted or not a valid image. '
                f'Error: {str(e)}'
            )
    
    def __eq__(self, other):
        """Required for migrations."""
        return (
            isinstance(other, ImageFileValidator) and
            self.allowed_types == other.allowed_types and
            self.allowed_extensions == other.allowed_extensions
        )


# Pre-configured validators for common use cases
validate_image_file = ImageFileValidator()
validate_profile_picture_size = FileSizeValidator(max_mb=5)  # 5MB limit for profile pictures
validate_product_image_size = FileSizeValidator(max_mb=10)  # 10MB limit for product images


__all__ = [
    'FileSizeValidator',
    'ImageFileValidator',
    'validate_image_file',
    'validate_profile_picture_size',
    'validate_product_image_size',
]


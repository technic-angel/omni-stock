"""Service for password-related operations."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


def change_password(*, user_id: int, old_password: str, new_password: str) -> bool:
    """
    Change a user's password after verifying the old password.
    
    Args:
        user_id: The ID of the user
        old_password: Current password for verification
        new_password: New password to set
        
    Returns:
        True if password was changed successfully
        
    Raises:
        User.DoesNotExist: If user not found
        ValidationError: If old password is incorrect or new password is invalid
    """
    user = User.objects.get(id=user_id)
    
    # Verify old password
    if not user.check_password(old_password):
        raise ValidationError({"old_password": "Current password is incorrect."})
    
    # Validate new password against Django's password validators
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        raise ValidationError({"new_password": list(e.messages)})
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return True


__all__ = ["change_password"]

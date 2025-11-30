"""Service for password reset operations."""

import secrets
from datetime import timedelta
from typing import Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

User = get_user_model()


class PasswordResetService:
    """
    Service for handling password reset flow.
    
    Uses Django's PasswordResetTokenGenerator for secure tokens,
    and cache for rate limiting.
    """
    
    TOKEN_EXPIRY_HOURS = 24
    RATE_LIMIT_MINUTES = 5  # Minimum time between reset requests
    
    def __init__(self):
        self.token_generator = PasswordResetTokenGenerator()
    
    def request_reset(self, email: str) -> bool:
        """
        Request a password reset for the given email.
        
        Sends a password reset email if the user exists.
        Always returns True to prevent email enumeration.
        
        Args:
            email: Email address to send reset link to
            
        Returns:
            True (always, to prevent email enumeration)
        """
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist
            return True
        
        # Rate limiting check
        cache_key = f"password_reset_{user.id}"
        if cache.get(cache_key):
            # Already sent recently, silently succeed
            return True
        
        # Generate token
        token = self.token_generator.make_token(user)
        
        # Build reset URL (frontend will handle this)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset-password?uid={user.id}&token={token}"
        
        # Send email
        try:
            send_mail(
                subject="Password Reset Request - Omni Stock",
                message=f"""
Hello {user.username},

You requested a password reset for your Omni Stock account.

Click the link below to reset your password:
{reset_url}

This link will expire in {self.TOKEN_EXPIRY_HOURS} hours.

If you didn't request this, you can safely ignore this email.

Best regards,
The Omni Stock Team
                """.strip(),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,  # Don't expose email sending failures
            )
        except Exception:
            # Log but don't expose failures
            pass
        
        # Set rate limit
        cache.set(cache_key, True, timeout=self.RATE_LIMIT_MINUTES * 60)
        
        return True
    
    def confirm_reset(self, user_id: int, token: str, new_password: str) -> bool:
        """
        Confirm password reset with token and set new password.
        
        Args:
            user_id: ID of the user
            token: Password reset token
            new_password: New password to set
            
        Returns:
            True if password was reset successfully
            
        Raises:
            ValidationError: If token is invalid or password is weak
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({"detail": "Invalid reset link."})
        
        # Verify token
        if not self.token_generator.check_token(user, token):
            raise ValidationError({"detail": "Invalid or expired reset link."})
        
        # Validate new password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            raise ValidationError({"new_password": list(e.messages)})
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return True


# Singleton instance
password_reset_service = PasswordResetService()


def request_password_reset(*, email: str) -> bool:
    """Request a password reset email."""
    return password_reset_service.request_reset(email)


def confirm_password_reset(*, user_id: int, token: str, new_password: str) -> bool:
    """Confirm password reset with token."""
    return password_reset_service.confirm_reset(user_id, token, new_password)


__all__ = ["request_password_reset", "confirm_password_reset"]

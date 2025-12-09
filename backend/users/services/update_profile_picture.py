"""Service for updating user profile pictures."""

from typing import Optional

from django.db import transaction

from backend.users.models import UserProfile


@transaction.atomic
def update_profile_picture(
    *,
    user_id: int,
    picture_url: Optional[str] = None,
    delete_picture: bool = False
) -> UserProfile:
    """
    Update or delete a user's profile picture URL.
    
    Args:
        user_id: ID of the user whose profile to update
        picture_url: New picture URL (optional)
        delete_picture: If True, removes the current picture URL
        
    Returns:
        Updated UserProfile instance
    """
    # Fetch the profile with select_for_update to lock the row
    profile = UserProfile.objects.select_for_update().get(user_id=user_id)

    if delete_picture:
        profile.profile_picture = None
    elif picture_url:
        profile.profile_picture = picture_url

    profile.save()
    return profile
    profile.save()
    return profile


__all__ = ["update_profile_picture"]

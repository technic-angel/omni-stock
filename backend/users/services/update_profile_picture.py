"""Service for updating user profile pictures."""

from typing import Optional

from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from backend.users.models import UserProfile


@transaction.atomic
def update_profile_picture(
    *,
    user_id: int,
    picture_file: Optional[UploadedFile] = None,
    delete_picture: bool = False
) -> UserProfile:
    """
    Update or delete a user's profile picture.
    
    This service encapsulates the business logic for profile picture management:
    - Deletes old picture file from storage when replacing
    - Handles picture removal
    - Updates database record
    - All within a database transaction for safety
    
    Args:
        user_id: ID of the user whose profile to update
        picture_file: New picture file to upload (optional)
        delete_picture: If True, removes the current picture
        
    Returns:
        Updated UserProfile instance
        
    Raises:
        UserProfile.DoesNotExist: If profile not found
        
    Example:
        # Upload new picture
        with open('avatar.jpg', 'rb') as f:
            profile = update_profile_picture(
                user_id=1, 
                picture_file=File(f, name='avatar.jpg')
            )
        
        # Remove picture
        profile = update_profile_picture(user_id=1, delete_picture=True)
    """
    # Fetch the profile with select_for_update to lock the row
    profile = UserProfile.objects.select_for_update().get(user_id=user_id)
    
    # Store old picture name for cleanup (before we change it)
    old_picture_name = profile.profile_picture.name if profile.profile_picture else None
    
    if delete_picture:
        # Remove the picture
        profile.profile_picture = None
    elif picture_file:
        # Assign new picture (Django handles storage)
        profile.profile_picture = picture_file
    
    # Save to database
    profile.save()
    
    # Clean up old file AFTER successful save
    # This prevents orphaned files and ensures we don't delete
    # a file if the database operation fails
    if old_picture_name and (delete_picture or picture_file):
        # Make sure we're not deleting the file we just saved
        current_picture_name = profile.profile_picture.name if profile.profile_picture else None
        if old_picture_name != current_picture_name:
            # Delete the old file from storage
            # Use storage backend to support both local and cloud storage
            try:
                profile.profile_picture.storage.delete(old_picture_name)
            except Exception:
                # If deletion fails (file already gone, etc), continue anyway
                # The important part is the database is updated
                pass
    
    return profile


__all__ = ["update_profile_picture"]

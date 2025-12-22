"""Selector for retrieving the current authenticated user with profile data."""

from django.contrib.auth import get_user_model

User = get_user_model()


def get_current_user_with_profile(*, user_id: int) -> User:
    """
    Retrieve a user with their related profile data.
    
    This selector uses select_related() to optimize the database query
    by performing a SQL JOIN instead of separate queries.
    
    Args:
        user_id: The ID of the user to retrieve
        
    Returns:
        User object with profile relationship pre-loaded
        
    Raises:
        User.DoesNotExist: If user is not found
        
    Example:
        user = get_current_user_with_profile(user_id=request.user.id)
        # user.profile is already loaded (no extra query)
        print(user.profile.bio)
    """
    return User.objects.select_related("profile").get(id=user_id)


__all__ = ["get_current_user_with_profile"]

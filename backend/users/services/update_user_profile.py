"""Service for updating user profile data."""

from datetime import date
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction

from backend.users.models import UserMediaType, UserProfile
from backend.users.services.user_media import remove_user_media, upsert_user_media
from backend.vendors.models import Vendor

User = get_user_model()
_UNSET = object()


@transaction.atomic
def update_user_profile(
    *,
    user_id: int,
    username: Optional[str] = None,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    password: Optional[str] = None,
    company_name: Optional[str] = None,
    company_site: Optional[str] = None,
    company_code: Optional[str] = None,
    phone_number: Optional[str] = None,
    birthdate: Optional[date] = None,
    mark_profile_completed: bool = False,
    phone: Optional[str] = None,
    bio: Optional[str] = None,
    vendor_id: Optional[int] = None,
    clear_vendor: bool = False,
    profile_picture: Optional[str] = None,
    delete_profile_picture: bool = False,
    avatar: Optional[dict] = _UNSET,
    vendor_logo: Optional[dict] = _UNSET,
    storefront_banner: Optional[dict] = _UNSET,
):
    """
    Update user and profile data atomically.
    
    Args:
        user_id: The ID of the user to update
        username: New username (optional)
        email: New email (optional)
        first_name: New first name (optional)
        last_name: New last name (optional)
        phone: New phone number (optional)
        bio: New bio text (optional)
        vendor_id: ID of vendor to associate with (optional)
        clear_vendor: If True, remove vendor association
        profile_picture: New profile picture file (optional)
        delete_profile_picture: If True, remove profile picture
        
    Returns:
        Updated User instance with profile
        
    Raises:
        User.DoesNotExist: If user not found
        Vendor.DoesNotExist: If vendor_id provided but not found
    """
    # Get user and profile with locks (create profile if missing)
    user = User.objects.select_for_update().get(id=user_id)
    profile, _ = UserProfile.objects.select_for_update().get_or_create(user_id=user_id)
    
    # Update user fields
    user_changed = False
    if username is not None and username != user.username:
        user.username = username
        user_changed = True
    if email is not None and email != user.email:
        user.email = email
        user_changed = True
    if first_name is not None and first_name != user.first_name:
        user.first_name = first_name
        user_changed = True
    if last_name is not None and last_name != user.last_name:
        user.last_name = last_name
        user_changed = True
    if password:
        user.set_password(password)
        user_changed = True
    if company_name is not None and company_name != user.company_name:
        user.company_name = company_name
        user_changed = True
    if company_site is not None and company_site != user.company_site:
        user.company_site = company_site
        user_changed = True
    if company_code is not None and company_code != user.company_code:
        user.company_code = company_code
        user_changed = True
    if phone_number is not None and phone_number != user.phone_number:
        user.phone_number = phone_number
        user_changed = True
    if birthdate is not None and birthdate != user.birthdate:
        user.birthdate = birthdate
        user_changed = True
    if mark_profile_completed and not user.profile_completed:
        user.profile_completed = True
        user_changed = True
    
    if user_changed:
        user.save()
    
    # Update profile fields
    profile_changed = False
    
    if phone is not None:
        profile.phone = phone
        profile_changed = True
    
    if bio is not None:
        profile.bio = bio
        profile_changed = True
    
    # Handle vendor association
    if clear_vendor:
        profile.vendor = None
        profile_changed = True
    elif vendor_id is not None:
        vendor = Vendor.objects.get(id=vendor_id)
        profile.vendor = vendor
        profile_changed = True
    
    # Handle profile picture
    if delete_profile_picture:
        profile.profile_picture = None
        profile_changed = True
    elif profile_picture is not None:
        profile.profile_picture = profile_picture
        profile_changed = True
    
    if profile_changed:
        profile.save()
    
    def _sync_media(payload, media_type: str):
        if payload is _UNSET:
            return
        if payload:
            upsert_user_media(user_id=user.id, media_type=media_type, payload=payload)
        else:
            remove_user_media(user_id=user.id, media_type=media_type)

    _sync_media(avatar, UserMediaType.PROFILE_AVATAR)
    _sync_media(vendor_logo, UserMediaType.VENDOR_LOGO)
    _sync_media(storefront_banner, UserMediaType.STOREFRONT_BANNER)

    # Refresh to get updated data
    user.refresh_from_db()
    return user


__all__ = ["update_user_profile"]

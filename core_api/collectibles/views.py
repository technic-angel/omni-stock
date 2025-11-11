from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import Collectible
from .serializers import CollectibleSerializer


class CollectibleViewSet(viewsets.ModelViewSet):
    """API endpoint that allows Collectible items to be viewed or edited.

    Behavior additions:
    - The list endpoint is scoped to the authenticated user's vendor (if present on their profile).
    - When creating a Collectible, the server sets the `user` and `vendor` based on the
      authenticated user's profile. Attempts to create a Collectible for another vendor
      will be rejected with 403.
    """

    serializer_class = CollectibleSerializer

    # keep a default ordering; queryset is resolved from get_queryset

    def get_queryset(self):
        """Return collectibles scoped to the requesting user's vendor or user account.

        - If the request is unauthenticated, return an empty queryset.
        - If the user has a `profile.vendor`, return collectibles for that vendor.
        - Otherwise, return collectibles owned by the user (fallback).
        """
        user = getattr(self.request, 'user', None)
        base_qs = Collectible.objects.all()
        if user is None or not user.is_authenticated:
            return base_qs.none()

        # Prefer vendor scoping when the user is attached to a vendor profile.
        profile = getattr(user, 'profile', None)
        if profile is not None and profile.vendor is not None:
            return base_qs.filter(vendor=profile.vendor).order_by('name')

        # Fallback: return items explicitly owned by the user
        return base_qs.filter(user=user).order_by('name')

    def perform_create(self, serializer):
        """Ensure the created Collectible is associated with the authenticated user
        and their vendor (if present). Reject attempts to create items for a different
        vendor than the user's profile.
        """
        user = self.request.user
        profile = getattr(user, 'profile', None)
        vendor = getattr(profile, 'vendor', None) if profile is not None else None

        # If the client included a vendor in the payload, ensure it matches the
        # authenticated user's vendor (if they have one).
        posted_vendor = serializer.validated_data.get('vendor')
        if vendor is not None and posted_vendor is not None and posted_vendor != vendor:
            raise PermissionDenied("You cannot create a Collectible for another vendor.")
        if vendor is None and posted_vendor is not None:
            raise PermissionDenied("You are not allowed to create a Collectible for a vendor.")

        # Force-associate the object with the user and vendor (if present).
        if vendor is not None:
            serializer.save(user=user, vendor=vendor)
        else:
            serializer.save(user=user)
"""Vendor domain viewsets."""

from rest_framework import viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated

from backend.core.permissions import resolve_user_vendor
from backend.vendors.api.serializers import VendorSerializer
from backend.vendors.models import Vendor
from backend.vendors.selectors.get_vendor import get_vendor
from backend.vendors.selectors.list_vendors import list_vendors


class VendorViewSet(viewsets.ModelViewSet):
    """Vendor CRUD with basic scoping to the user's vendor profile."""

    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_vendors(user=getattr(self.request, "user", None))

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value is None:
            raise NotFound("Vendor identifier is missing.")
        vendor = get_vendor(user=self.request.user, vendor_id=lookup_value)
        if vendor is None:
            raise PermissionDenied("You do not have access to this vendor.")
        return vendor

    def perform_create(self, serializer):
        vendor = serializer.save()
        self._attach_user_profile_vendor(vendor)

    def perform_update(self, serializer):
        serializer.save()

    def _attach_user_profile_vendor(self, vendor: Vendor):
        profile_vendor = resolve_user_vendor(self.request.user)
        if profile_vendor is None:
            profile = getattr(self.request.user, "profile", None)
            if profile is not None:
                profile.vendor = vendor
                profile.save(update_fields=["vendor"])


__all__ = ["VendorViewSet"]

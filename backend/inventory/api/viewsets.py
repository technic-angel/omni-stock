"""Inventory domain viewsets."""

from rest_framework import viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated

from backend.core.permissions import VendorScopedPermission, resolve_user_vendor
from backend.inventory.models import Collectible
from backend.inventory.selectors.get_item import get_item
from backend.inventory.selectors.list_items import list_items
from backend.inventory.services.create_item import create_item
from backend.inventory.services.delete_item import delete_item
from backend.inventory.services.update_item import update_item
from backend.inventory.api.serializers import CollectibleSerializer


class CollectibleViewSet(viewsets.ModelViewSet):
    """Inventory CRUD viewset with vendor scoping rules."""

    serializer_class = CollectibleSerializer
    permission_classes = [IsAuthenticated, VendorScopedPermission]

    def get_queryset(self):
        return list_items(user=getattr(self.request, 'user', None), filters=self.request.query_params)

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value is None:
            raise NotFound("Collectible identifier is missing.")
        try:
            obj = get_item(user=self.request.user, collectible_id=lookup_value)
        except Collectible.DoesNotExist as exc:
            raise NotFound(str(exc)) from exc
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        payload = dict(serializer.validated_data)
        card_details_data = payload.pop('card_details', None)
        vendor = self._resolve_vendor(user=self.request.user, posted_vendor=payload.get('vendor'))
        if vendor is not None:
            payload['vendor'] = vendor
        payload['user'] = self.request.user

        instance = create_item(data=payload, card_details_data=card_details_data)
        serializer.instance = instance

    def perform_update(self, serializer):
        payload = dict(serializer.validated_data)
        card_details_data = payload.pop('card_details', None)
        vendor = self._resolve_vendor(
            user=self.request.user,
            posted_vendor=payload.get('vendor'),
            current_vendor=serializer.instance.vendor,
        )
        if vendor is not None:
            payload['vendor'] = vendor

        instance = update_item(
            instance=serializer.instance,
            data=payload,
            card_details_data=card_details_data,
        )
        serializer.instance = instance

    def perform_destroy(self, instance):
        delete_item(instance=instance)

    def _resolve_vendor(self, *, user, posted_vendor, current_vendor=None):
        profile_vendor = resolve_user_vendor(user)
        if profile_vendor is not None:
            if posted_vendor is not None and posted_vendor != profile_vendor:
                raise PermissionDenied("You cannot create a Collectible for another vendor.")
            return profile_vendor

        if posted_vendor is not None:
            raise PermissionDenied("You are not allowed to create a Collectible for a vendor.")

        return current_vendor


__all__ = ['CollectibleViewSet']

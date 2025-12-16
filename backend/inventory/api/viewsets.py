"""Inventory domain viewsets."""

from django.conf import settings
from rest_framework import viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated

from backend.core.permissions import VendorScopedPermission, resolve_user_vendor
from backend.inventory.api.serializers import CollectibleSerializer
from backend.inventory.models import Collectible
from backend.inventory.selectors.get_item import get_item
from backend.inventory.selectors.list_items import list_items
from backend.inventory.services.create_item import create_item
from backend.inventory.services.delete_item import delete_item
from backend.inventory.services.update_item import update_item
from backend.vendors.api.permissions import HasStoreAccess, user_has_store_access
from backend.vendors.services.store_defaults import ensure_default_store


class CollectibleViewSet(viewsets.ModelViewSet):
    """Inventory CRUD viewset with vendor scoping rules."""

    serializer_class = CollectibleSerializer
    permission_classes = [IsAuthenticated, VendorScopedPermission, HasStoreAccess]

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
        store = self._resolve_store(store=payload.get("store"), vendor=vendor)
        if store is None:
            raise PermissionDenied("A vendor with an active store is required to manage inventory.")
        payload['store'] = store
        self._assert_store_permissions(store=store, vendor=vendor)
        payload['user'] = self.request.user

        instance = create_item(data=payload, card_details_data=card_details_data)
        serializer.instance = instance

    def perform_update(self, serializer):
        payload = dict(serializer.validated_data)
        card_details_data = payload.pop('card_details', None)
        requested_vendor = self._resolve_vendor(
            user=self.request.user,
            posted_vendor=payload.get('vendor'),
            current_vendor=serializer.instance.vendor,
        )
        if requested_vendor is not None:
            payload['vendor'] = requested_vendor

        active_vendor = requested_vendor or serializer.instance.vendor
        store = self._resolve_store(
            store=payload.get("store") or getattr(serializer.instance, "store", None),
            vendor=active_vendor,
        )
        if store is None:
            raise PermissionDenied("A store is required for this action.")
        payload['store'] = store
        self._assert_store_permissions(store=store, vendor=active_vendor)

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

    def _assert_store_permissions(self, *, store, vendor):
        if store is None:
            raise PermissionDenied("A store is required for this action.")
        if vendor is not None and store.vendor_id != vendor.id:
            raise PermissionDenied("Store must belong to the active vendor.")
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            return
        if store is None:
            raise PermissionDenied("A store is required for this action.")
        if not user_has_store_access(self.request.user, store):
            raise PermissionDenied("You do not have access to that store.")

    def _resolve_store(self, *, store, vendor):
        if store is not None or vendor is None:
            return store
        return ensure_default_store(vendor)


__all__ = ['CollectibleViewSet']

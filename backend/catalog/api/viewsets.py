"""Inventory domain viewsets."""

from django.conf import settings
from rest_framework import viewsets
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated

from backend.catalog.api.serializers import CatalogItemSerializer, SetSerializer, ProductSerializer
from backend.catalog.models import CatalogItem, Set, Product
from backend.catalog.selectors.get_item import get_item
from backend.catalog.selectors.list_items import list_items
from backend.catalog.services.create_item import create_item
from backend.catalog.services.delete_item import delete_item
from backend.catalog.services.update_item import update_item
from backend.core.permissions import VendorScopedPermission, resolve_user_store, resolve_user_vendor
from backend.org.api.permissions import HasStoreAccess, user_has_store_access
from backend.org.services.store_defaults import ensure_default_store


class SetViewSet(viewsets.ReadOnlyModelViewSet):
    """ReadOnly ViewSet for Sets."""
    queryset = Set.objects.all().order_by('-release_date')
    serializer_class = SetSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['name', 'code', 'era']
    search_fields = ['name', 'code']


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ReadOnly ViewSet for Products."""
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['set', 'type']
    search_fields = ['name']


class CatalogItemViewSet(viewsets.ModelViewSet):
    """Inventory CRUD viewset with vendor scoping rules."""

    serializer_class = CatalogItemSerializer
    permission_classes = [IsAuthenticated, VendorScopedPermission, HasStoreAccess]

    def get_queryset(self):
        return list_items(user=getattr(self.request, 'user', None), filters=self.request.query_params)

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value is None:
            raise NotFound("CatalogItem identifier is missing.")
        try:
            obj = get_item(user=self.request.user, item_id=lookup_value)
        except CatalogItem.DoesNotExist as exc:
            raise NotFound(str(exc)) from exc
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        payload = dict(serializer.validated_data)
        card_details_data = payload.pop('card_metadata', None)
        variant_payloads = payload.pop('variant_payloads', None)
        media_payloads = payload.pop('image_payloads', None)
        vendor = self._resolve_vendor(user=self.request.user, posted_vendor=payload.get('vendor'))
        if vendor is not None:
            payload['vendor'] = vendor
        store = self._resolve_store(store=payload.get("store"), vendor=vendor)
        if store is None:
            raise PermissionDenied("A vendor with an active store is required to manage inventory.")
        payload['store'] = store
        self._assert_store_permissions(store=store, vendor=vendor)
        payload['user'] = self.request.user

        instance = create_item(
            data=payload,
            card_details_data=card_details_data,
            variant_payloads=variant_payloads,
            media_payloads=media_payloads,
        )
        serializer.instance = instance

    def perform_update(self, serializer):
        payload = dict(serializer.validated_data)
        card_details_data = payload.pop('card_metadata', None)
        variant_payloads = payload.pop('variant_payloads', None)
        media_payloads = payload.pop('image_payloads', None)
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
            variant_payloads=variant_payloads,
            media_payloads=media_payloads,
        )
        serializer.instance = instance

    def perform_destroy(self, instance):
        delete_item(instance=instance)

    def _resolve_vendor(self, *, user, posted_vendor, current_vendor=None):
        profile_vendor = resolve_user_vendor(user)
        if profile_vendor is not None:
            if posted_vendor is not None and posted_vendor != profile_vendor:
                raise PermissionDenied("You cannot create a CatalogItem for another vendor.")
            return profile_vendor

        if posted_vendor is not None:
            raise PermissionDenied("You are not allowed to create a CatalogItem for a vendor.")

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
        if store is not None:
            return store
        if vendor is None:
            return None
        preferred_store = resolve_user_store(self.request.user)
        if preferred_store and preferred_store.vendor_id == vendor.id:
            return preferred_store
        return ensure_default_store(vendor)


__all__ = ['CatalogItemViewSet']

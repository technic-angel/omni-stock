"""Vendor API routing."""

from django.urls import include, path
from rest_framework import routers

from backend.vendors.api.viewsets import (
    StoreAccessViewSet,
    StoreViewSet,
    VendorInviteViewSet,
    VendorMemberViewSet,
    VendorViewSet,
)

router = routers.DefaultRouter()
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r"vendor-members", VendorMemberViewSet, basename="vendor-member")
router.register(r"vendor-invites", VendorInviteViewSet, basename="vendor-invite")
router.register(r"vendor-stores", StoreViewSet, basename="vendor-store")
router.register(r"vendor-store-access", StoreAccessViewSet, basename="vendor-store-access")

urlpatterns = [
    path("", include(router.urls)),
]


__all__ = ["urlpatterns"]

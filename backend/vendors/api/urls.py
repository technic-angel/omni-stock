"""Vendor API routing."""

from django.urls import include, path
from rest_framework import routers

from backend.vendors.api.viewsets import VendorViewSet

router = routers.DefaultRouter()
router.register(r"vendors", VendorViewSet, basename="vendor")

urlpatterns = [
    path("", include(router.urls)),
]


__all__ = ["urlpatterns"]

"""Inventory API URL routes."""

from django.urls import path

from backend.inventory.api.views import InventoryOverviewView

urlpatterns = [
    path("inventory/overview/", InventoryOverviewView.as_view(), name="inventory-overview"),
]

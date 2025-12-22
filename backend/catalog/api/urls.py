from django.urls import include, path
from rest_framework import routers

from backend.catalog.api.viewsets import CatalogItemViewSet

router = routers.DefaultRouter()
router.register(r'catalog/items', CatalogItemViewSet, basename='catalog-item')

urlpatterns = [
    path('', include(router.urls)),
]

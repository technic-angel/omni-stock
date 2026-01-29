from django.urls import include, path
from rest_framework import routers

from backend.catalog.api.viewsets import CatalogItemViewSet, SetViewSet, ProductViewSet

router = routers.DefaultRouter()
router.register(r'catalog/items', CatalogItemViewSet, basename='catalog-item')
router.register(r'catalog/sets', SetViewSet, basename='catalog-set')
router.register(r'catalog/products', ProductViewSet, basename='catalog-product')

urlpatterns = [
    path('', include(router.urls)),
]

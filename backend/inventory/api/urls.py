from django.urls import include, path
from rest_framework import routers

from backend.inventory.api.viewsets import CollectibleViewSet

router = routers.DefaultRouter()
router.register(r'collectibles', CollectibleViewSet, basename='collectible')

urlpatterns = [
    path('', include(router.urls)),
]

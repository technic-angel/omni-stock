from django.urls import path, include
from rest_framework import routers
from .views import CollectibleViewSet

router = routers.DefaultRouter()
router.register(r'collectibles', CollectibleViewSet, basename='collectible')

urlpatterns = [
    # This mounts the ViewSet at /api/v1/collectibles/ when included from
    # the project urls (which includes this module at '/api/v1').
    path('', include(router.urls)),
]

"""
omni_stock URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include # Import 'include'
from django.conf import settings
from django.conf.urls.static import static

# SimpleJWT views for token obtain/refresh/verify
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
# Register view (user sign-up)
from backend.users.api.viewsets import RegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
     # --- API Endpoints ---
    # Link the app-level URLs to the /api/v1/collectibles/ path
    # Ensure the prefix ends with a trailing slash so included routes
    # are mounted at `/api/v1/...`, e.g. `/api/v1/collectibles/`.
    path('api/v1/', include('backend.inventory.api.urls')),
    path('api/v1/', include('backend.vendors.api.urls')),
    # JWT token endpoints under /api/v1/auth/
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/v1/auth/register/', RegisterView.as_view(), name='auth_register'),
    # Add your API paths here later: path('api/v1/auth/', include('auth.urls')),
]

# Health endpoint for deploy checks
def health_view(request):
    from django.http import JsonResponse
    return JsonResponse({"status": "ok"})

urlpatterns += [
    path('health/', health_view, name='health'),
]

# Serving Media Files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

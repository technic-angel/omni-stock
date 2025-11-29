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

# Root endpoint - API info and links
def root_view(request):
    from django.http import JsonResponse
    from django.shortcuts import redirect
    
    # Check if request is from a browser (looks for text/html in Accept header)
    accept_header = request.META.get('HTTP_ACCEPT', '')
    
    if 'text/html' in accept_header:
        # Redirect browsers to configured frontend URL (set via FRONTEND_URL env var)
        return redirect(settings.FRONTEND_URL)
    
    # API clients get JSON response
    return JsonResponse({
        "message": "Omni-Stock API",
        "version": "1.0",
        "frontend_url": settings.FRONTEND_URL,
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/v1/",
            "health": "/health/",
            "docs": "/api/v1/schema/",
            "auth": {
                "register": "/api/v1/auth/register/",
                "token": "/api/v1/auth/token/",
                "refresh": "/api/v1/auth/token/refresh/",
                "verify": "/api/v1/auth/token/verify/"
            }
        }
    })

urlpatterns += [
    path('', root_view, name='root'),
    path('health/', health_view, name='health'),
]

# Serving Media Files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

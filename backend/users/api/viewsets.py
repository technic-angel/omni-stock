"""User domain viewsets and API endpoints."""

from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from backend.users.api.serializers import (
    ChangePasswordSerializer,
    CompleteProfileSerializer,
    CurrentUserSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UpdateProfilePictureSerializer,
    CheckEmailExistsSerializer
)
from backend.users.selectors.get_current_user import get_current_user_with_profile


class RegisterView(GenericAPIView):
    """Public endpoint for registering a new user account."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"username": user.username, "id": user.id}, status=status.HTTP_201_CREATED)


class CompleteProfileView(GenericAPIView):
    """Authenticated endpoint for completing the onboarding profile form."""

    permission_classes = [IsAuthenticated]
    serializer_class = CompleteProfileSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user).data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["auth"],
    responses={200: CurrentUserSerializer},
    examples=[
        OpenApiExample(
            "User with Profile",
            value={
                "id": 1,
                "username": "melissa",
                "email": "melissa@example.com",
                "profile": {
                    "id": 1,
                    "phone": "555-1234",
                    "bio": "Django developer",
                    "profile_picture": "https://example.com/media/profile_pictures/melissa.jpg",
                    "created_at": "2025-11-29T10:00:00Z",
                    "updated_at": "2025-11-29T10:00:00Z"
                }
            }
        )
    ]
)
class CurrentUserView(RetrieveUpdateAPIView):
    """
    GET /api/v1/auth/me/
    PUT/PATCH /api/v1/auth/me/
    
    Returns and updates the currently authenticated user's data including their profile.
    
    - Requires authentication (JWT token)
    - Uses selector pattern to optimize database queries
    - Returns nested profile data with full profile_picture URL
    - Supports file uploads for profile_picture (multipart/form-data)
    
    To upload a profile picture:
    - Send PUT or PATCH request with multipart/form-data
    - Include 'profile_picture' field with image file
    - Supported formats: JPEG, PNG, GIF, WebP
    - Max size: 5MB
    
    Response:
        {
            "id": 1,
            "username": "melissa",
            "email": "melissa@example.com",
            "profile": {
                "id": 1,
                "phone": "555-1234",
                "bio": "Django developer",
                "profile_picture": "http://localhost:8000/media/profile_pictures/melissa.jpg",
                "created_at": "2025-11-29T10:00:00Z",
                "updated_at": "2025-11-29T10:00:00Z"
            }
        }
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CurrentUserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        """
        Override get_object to use our selector pattern.
        
        This method is called by DRF's RetrieveAPIView to fetch the object.
        We use our selector to get the user with optimized queries.
        """
        return get_current_user_with_profile(user_id=self.request.user.id)
    
    def get_serializer_class(self):
        """Use different serializers for read vs write operations."""
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfilePictureSerializer
        return CurrentUserSerializer
    
    def update(self, request, *args, **kwargs):
        """Handle update and return CurrentUserSerializer response."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Use UpdateProfilePictureSerializer for input
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Refresh the instance to get updated data
        updated_instance = get_current_user_with_profile(user_id=self.request.user.id)
        
        # Return with CurrentUserSerializer for consistent output
        output_serializer = CurrentUserSerializer(updated_instance)
        return Response(output_serializer.data)

@extend_schema(tags=["auth"])
class ChangePasswordView(GenericAPIView):
    """
    POST /api/v1/auth/password/change/
    
    Change password for the authenticated user.
    
    Requires:
    - Authentication (JWT token)
    - Current password for verification
    - New password (min 8 characters, validated against Django password validators)
    
    Request body:
        {
            "old_password": "current_password",
            "new_password": "new_secure_password"
        }
    
    Response:
        {"detail": "Password changed successfully."}
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=["auth"])
class PasswordResetRequestView(GenericAPIView):
    """
    POST /api/v1/auth/password/reset/
    
    Request a password reset email.
    
    - Public endpoint (no authentication required)
    - Rate limited to 1 request per 5 minutes per user
    - Always returns success to prevent email enumeration
    
    Request body:
        {
            "email": "user@example.com"
        }
    
    Response:
        {"detail": "If an account with that email exists, a password reset link has been sent."}
    """
    
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "If an account with that email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=["auth"])
class PasswordResetConfirmView(GenericAPIView):
    """
    POST /api/v1/auth/password/reset/confirm/
    
    Confirm password reset with token and set new password.
    
    - Public endpoint (no authentication required)
    - Requires valid reset token from email
    - Token expires after 24 hours
    
    Request body:
        {
            "uid": 1,
            "token": "abc123...",
            "new_password": "new_secure_password"
        }
    
    Response:
        {"detail": "Password has been reset successfully."}
    """
    
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=["auth"])
class LogoutView(GenericAPIView):
    """
    POST /api/v1/auth/logout/
    
    Logout by blacklisting the refresh token.
    
    - Requires authentication (JWT token)
    - Blacklists the provided refresh token
    - After logout, the refresh token can no longer be used to get new access tokens
    
    Request body:
        {
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI..."
        }
    
    Response:
        {"detail": "Successfully logged out."}
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK
        )

class CheckEmailView(GenericAPIView):
    """
    POST /api/v1/auth/register/check-email/
    
    Check if an email is already registered.
    
    - Public endpoint (no authentication required)
    
    Request body:
        {
            "email": "user@example.com"
        }
    """

    permission_classes = [AllowAny]
    serializer_class = CheckEmailExistsSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(
            result,
            status=status.HTTP_200_OK
        )

__all__ = [
    "RegisterView",
    "CompleteProfileView",
    "CurrentUserView",
    "ChangePasswordView",
    "PasswordResetRequestView",
    "PasswordResetConfirmView",
    "LogoutView",
    "CheckEmailView",
]
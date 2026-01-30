from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from rest_framework import serializers
import uuid

class UploadFileSerializer(serializers.Serializer):
    file = serializers.FileField()

class UploadFileResponseSerializer(serializers.Serializer):
    url = serializers.URLField()

class UploadFileView(APIView):
    """
    Generic file upload endpoint.
    Saves files using the configured default storage (Local or Supabase).
    Returns the public URL of the uploaded file.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    serializer_class = UploadFileSerializer

    @extend_schema(
        request=UploadFileSerializer,
        responses={201: UploadFileResponseSerializer},
        summary="Upload a file",
        description="Upload a file to the configured storage backend (S3 or Local) and get a public URL."
    )
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic validation
        if file_obj.size > 5 * 1024 * 1024:  # 5MB limit
             return Response({"error": "File too large (max 5MB)"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique filename to prevent collisions
        ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else 'bin'
        filename = f"uploads/{uuid.uuid4()}.{ext}"
        
        # Save file
        try:
            saved_path = default_storage.save(filename, file_obj)
            file_url = default_storage.url(saved_path)
            
            # Ensure we return a full URL for local dev
            if not file_url.startswith('http'):
                file_url = request.build_absolute_uri(file_url)

            return Response({"url": file_url}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

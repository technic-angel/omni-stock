"""Inventory API views."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.inventory.selectors.overview import get_inventory_overview


class InventoryOverviewView(APIView):
    """Returns aggregate inventory statistics for the authenticated user's vendor."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_inventory_overview(user=request.user)
        return Response(data, status=status.HTTP_200_OK)

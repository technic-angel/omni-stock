from rest_framework import viewsets
from .models import Collectible
from .serializers import CollectibleSerializer

# We use ModelViewSet because it provides all the standard CRUD operations
# (Create, Retrieve, Update, Destroy) out-of-the-box.
class CollectibleViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows Collectible items to be viewed or edited.

    This view handles the following API requests:
    - GET /api/v1/collectibles/  (List all items)
    - POST /api/v1/collectibles/ (Create a new item)
    - GET /api/v1/collectibles/{id}/ (Retrieve a single item)
    - PUT/PATCH /api/v1/collectibles/{id}/ (Update an existing item)
    - DELETE /api/v1/collectibles/{id}/ (Delete an item)
    """
    # 1. Define the Queryset: What data to show
    queryset = Collectible.objects.all().order_by('name')

    # 2. Define the Serializer: How to convert data to/from JSON
    serializer_class = CollectibleSerializer
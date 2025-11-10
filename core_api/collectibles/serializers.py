from rest_framework import serializers
from .models import Collectible

class CollectibleSerializer(serializers.ModelSerializer):
    """
    Serializer for the Collectible model.
    Handles converting Collectible objects to JSON and validating/converting
    incoming JSON data back into Collectible objects.
    """
    class Meta:
        # Specifies the model this serializer works with
        model = Collectible
        # 'fields = '__all__'' includes all fields from the Collectible model
        # which is ideal for a basic CRUD API.
        fields = '__all__'
        # The 'read_only_fields' are fields that should only be included in
        # responses (GET) and ignored during creation or updates (POST, PUT).
        read_only_fields = ('last_updated',)
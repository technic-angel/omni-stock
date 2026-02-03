from rest_framework import serializers


class InventoryOverviewStoreSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    location = serializers.CharField(allow_null=True, required=False)
    isDefault = serializers.BooleanField()
    status = serializers.CharField()
    totalSkus = serializers.IntegerField()
    unitsOnHand = serializers.IntegerField()
    lowStock = serializers.IntegerField()


class InventoryOverviewStatsSerializer(serializers.Serializer):
    totalSkus = serializers.IntegerField()
    totalUnits = serializers.IntegerField()
    lowStock = serializers.IntegerField()
    pendingTransfers = serializers.IntegerField()


class InventoryOverviewSerializer(serializers.Serializer):
    stats = InventoryOverviewStatsSerializer()
    stores = InventoryOverviewStoreSerializer(many=True)

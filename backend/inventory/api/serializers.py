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


class CategoryBreakdownSerializer(serializers.Serializer):
    category = serializers.CharField()
    count = serializers.IntegerField()
    value = serializers.DecimalField(max_digits=12, decimal_places=2)


class TopItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    sku = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    value = serializers.DecimalField(max_digits=12, decimal_places=2)
    image = serializers.URLField(allow_null=True, required=False)


class InventoryOverviewStatsSerializer(serializers.Serializer):
    totalSkus = serializers.IntegerField()
    totalUnits = serializers.IntegerField()
    lowStock = serializers.IntegerField()
    portfolioValue = serializers.DecimalField(max_digits=12, decimal_places=2)
    acquisitionCost = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingTransfers = serializers.IntegerField()


class InventoryOverviewSerializer(serializers.Serializer):
    stats = InventoryOverviewStatsSerializer()
    categoryBreakdown = CategoryBreakdownSerializer(many=True)
    topItems = TopItemSerializer(many=True)
    stores = InventoryOverviewStoreSerializer(many=True)

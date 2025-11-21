from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.inventory'
    label = 'inventory'
    verbose_name = 'Inventory Domain'

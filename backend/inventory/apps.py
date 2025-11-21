from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.inventory'
    # Keep the historical `collectibles` app label so existing migrations and
    # database tables remain intact while the code lives under backend/.
    label = 'collectibles'
    verbose_name = 'Inventory Domain'

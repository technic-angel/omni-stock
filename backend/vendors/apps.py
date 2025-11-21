from django.apps import AppConfig


class VendorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.vendors'
    label = 'vendors'
    verbose_name = 'Vendor Domain'

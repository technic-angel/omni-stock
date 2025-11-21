from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.core'
    label = 'backend_core'
    verbose_name = 'Backend Core'

from django.apps import AppConfig


class OrgConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.org'
    label = 'org'
    verbose_name = 'Organization Domain'

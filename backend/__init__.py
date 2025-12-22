"""Backend domain package initializer.

This file makes `backend` importable as a Python package so Django can
discover `backend.users`, `backend.org`, and `backend.catalog` apps
when added to `INSTALLED_APPS`.
"""

__all__ = [
    'users',
    'org',
    'catalog',
]

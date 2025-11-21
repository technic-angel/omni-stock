"""Backend domain package initializer.

This file makes `backend` importable as a Python package so Django can
discover `backend.users`, `backend.vendors`, and `backend.inventory` apps
when added to `INSTALLED_APPS` during Stage 2.
"""

__all__ = [
    'users',
    'vendors',
    'inventory',
]

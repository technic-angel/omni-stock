"""Compatibility shim for the `collectibles` Django app.

This package keeps the historical `collectibles` import path alive while
the actual models/serializers live under the domain-driven backend
modules. Add app-level initialization here if/when the shim needs to
evolve.
"""

__all__ = []

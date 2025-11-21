#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
# Ensure scripts executed from the backend folder can still import the
# top-level `backend` package as well as the legacy `collectibles` app,
# which currently lives under `core_api/collectibles` pending removal.
for extra_path in (REPO_ROOT, REPO_ROOT / 'core_api'):
    extra_str = str(extra_path)
    if extra_str not in sys.path:
        sys.path.insert(0, extra_str)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.omni_stock.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

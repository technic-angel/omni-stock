import os
import pytest

from backend.core import storage_backends


def test_supabase_storage_raises_without_storages(monkeypatch):
    # Ensure STORAGES_AVAILABLE is False to validate the helpful ImportError
    monkeypatch.setattr(storage_backends, "STORAGES_AVAILABLE", False)
    with pytest.raises(ImportError) as exc:
        storage_backends.SupabaseStorage()
    assert "django-storages is required" in str(exc.value)


def test_supabase_storage_requires_endpoint_and_keys(monkeypatch):
    # If storages are available, missing env vars should raise ValueError
    monkeypatch.setattr(storage_backends, "STORAGES_AVAILABLE", True)
    # Clear env vars
    monkeypatch.delenv("SUPABASE_STORAGE_ENDPOINT", raising=False)
    monkeypatch.delenv("SUPABASE_STORAGE_ACCESS_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_STORAGE_SECRET_KEY", raising=False)
    with pytest.raises(ValueError):
        storage_backends.SupabaseStorage()

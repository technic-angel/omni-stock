import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.vendors.models import Vendor
from backend.vendors.services.create_vendor import create_vendor
from backend.users.models import UserProfile


User = get_user_model()


@pytest.mark.django_db
def test_vendor_viewset_list_scoped_to_profile():
    vendor = create_vendor(name="Scoped Vendor")
    other_vendor = create_vendor(name="Other Vendor")

    user = User.objects.create_user(username="vendor_view", email="vendor@example.com", password="Strongpass123")
    UserProfile.objects.create(user=user, vendor=vendor)

    client = APIClient()
    client.force_authenticate(user=user)

    resp = client.get("/api/v1/vendors/")
    assert resp.status_code == 200
    body = resp.json()
    ids = [item["id"] for item in body]
    assert vendor.id in ids
    assert other_vendor.id not in ids


@pytest.mark.django_db
def test_vendor_viewset_create_attaches_profile():
    user = User.objects.create_user(username="creator", email="creator@example.com", password="Strongpass123")
    UserProfile.objects.create(user=user)

    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"name": "API Vendor", "description": "Via API"}
    resp = client.post("/api/v1/vendors/", payload, format="json")
    assert resp.status_code == 201

    vendor_id = resp.json()["id"]
    vendor = Vendor.objects.get(pk=vendor_id)
    profile = UserProfile.objects.get(user=user)
    assert profile.vendor == vendor

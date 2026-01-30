import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.org.models import Vendor, VendorMember, VendorMemberRole
from backend.org.services.create_vendor import create_vendor

User = get_user_model()


@pytest.mark.django_db
def test_vendor_viewset_list_scoped_to_profile():
    vendor = create_vendor(name="Scoped Vendor")
    other_vendor = create_vendor(name="Other Vendor")

    user = User.objects.create_user(username="vendor_view", email="vendor@example.com", password="Strongpass123")
    vendor.members.create(user=user, role=VendorMemberRole.ADMIN, is_active=True, is_primary=True)
    other_vendor.members.create(user=user, role=VendorMemberRole.MEMBER, is_active=True, is_primary=False)

    client = APIClient()
    client.force_authenticate(user=user)

    resp = client.get("/api/v1/vendors/")
    assert resp.status_code == 200
    body = resp.json()
    results = body["results"] if isinstance(body, dict) and "results" in body else body
    ids = [item["id"] for item in results]
    assert vendor.id in ids
    assert other_vendor.id in ids


@pytest.mark.django_db
def test_vendor_viewset_create_sets_primary_membership():
    user = User.objects.create_user(username="creator", email="creator@example.com", password="Strongpass123")

    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"name": "API Vendor", "description": "Via API"}
    resp = client.post("/api/v1/vendors/", payload, format="json")
    assert resp.status_code == 201

    vendor = Vendor.objects.get(pk=resp.json()["id"])
    membership = VendorMember.objects.get(vendor=vendor, user=user)
    assert membership.is_primary is True


@pytest.mark.django_db
def test_vendor_viewset_create_bootstraps_owner_membership():
    user = User.objects.create_user(username="owner", email="owner@example.com", password="Strongpass123")

    client = APIClient()
    client.force_authenticate(user=user)

    payload = {"name": "Owner Vendor"}
    resp = client.post("/api/v1/vendors/", payload, format="json")
    assert resp.status_code == 201

    vendor = Vendor.objects.get(pk=resp.json()["id"])
    membership = VendorMember.objects.get(vendor=vendor, user=user)

    assert membership.role == VendorMemberRole.OWNER
    assert membership.is_active is True
    assert membership.invite_status == VendorMember.InviteStatus.ACCEPTED
    assert membership.active_store is not None

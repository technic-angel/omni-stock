import pytest
from rest_framework.test import APIClient

from backend.inventory.tests.factories import UserFactory, VendorFactory
from backend.vendors.models import StoreAccess, VendorMember, VendorMemberRole


@pytest.fixture
def vendor_admin(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    vendor = VendorFactory.create()
    admin = UserFactory.create()
    VendorMember.objects.create(vendor=vendor, user=admin, role=VendorMemberRole.ADMIN)
    return admin, vendor


@pytest.mark.django_db
def test_member_viewset_lists_members(vendor_admin):
    admin, vendor = vendor_admin
    other = UserFactory.create()
    VendorMember.objects.create(vendor=vendor, user=other, role=VendorMemberRole.STAFF)

    client = APIClient()
    client.force_authenticate(admin)

    resp = client.get("/api/v1/vendor-members/")
    assert resp.status_code == 200
    body = resp.json()
    emails = [item["email"] for item in body]
    assert admin.email in emails
    assert other.email in emails


@pytest.mark.django_db
def test_member_viewset_invites_new_member(vendor_admin):
    admin, _ = vendor_admin
    client = APIClient()
    client.force_authenticate(admin)

    payload = {"email": "new@example.com", "role": VendorMemberRole.STAFF}
    resp = client.post("/api/v1/vendor-members/", payload, format="json")
    assert resp.status_code == 201
    assert VendorMember.objects.filter(user__email="new@example.com").exists()


@pytest.mark.django_db
def test_store_viewset_create_and_store_access(vendor_admin):
    admin, vendor = vendor_admin
    member_user = UserFactory.create()
    member = VendorMember.objects.create(vendor=vendor, user=member_user, role=VendorMemberRole.STAFF)

    client = APIClient()
    client.force_authenticate(admin)

    store_resp = client.post("/api/v1/vendor-stores/", {"name": "HQ"}, format="json")
    assert store_resp.status_code == 201
    store_id = store_resp.json()["id"]

    access_resp = client.post(
        "/api/v1/vendor-store-access/",
        {"store": store_id, "member": member.id, "role": "manager"},
        format="json",
    )
    assert access_resp.status_code == 201
    assert StoreAccess.objects.filter(store_id=store_id, member=member).exists()

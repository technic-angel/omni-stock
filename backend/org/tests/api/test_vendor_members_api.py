import pytest
from rest_framework.test import APIClient

from backend.catalog.tests.factories import StoreFactory, UserFactory, VendorFactory
from backend.org.models import StoreAccess, VendorMember, VendorMemberRole


@pytest.fixture
def vendor_admin(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    vendor = VendorFactory.create()
    admin = UserFactory.create()
    VendorMember.objects.create(vendor=vendor, user=admin, role=VendorMemberRole.ADMIN, is_active=True, is_primary=True)
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
    results = body["results"] if isinstance(body, dict) and "results" in body else body
    emails = [item["email"] for item in results]
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
def test_reinviting_member_resets_status(vendor_admin):
    admin, vendor = vendor_admin
    user = UserFactory.create()
    member = VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.MEMBER,
        invite_status=VendorMember.InviteStatus.ACCEPTED,
        is_active=True,
    )

    client = APIClient()
    client.force_authenticate(admin)

    resp = client.post("/api/v1/vendor-members/", {"email": user.email}, format="json")
    assert resp.status_code == 201
    member.refresh_from_db()
    assert member.invite_status == VendorMember.InviteStatus.PENDING
    assert member.is_active is False


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


@pytest.mark.django_db
def test_select_vendor_updates_profile_and_store(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    vendor = VendorFactory.create()
    StoreFactory.create(vendor=vendor)
    user = UserFactory.create()
    VendorMember.objects.create(vendor=vendor, user=user, role=VendorMemberRole.ADMIN, is_active=True)

    client = APIClient()
    client.force_authenticate(user=user)

    resp = client.post("/api/v1/vendor-members/select/", {"vendor": vendor.id}, format="json")
    assert resp.status_code == 200
    member = VendorMember.objects.get(user=user, vendor=vendor)
    assert member.is_primary is True
    assert member.active_store is not None


@pytest.mark.django_db
def test_select_store_updates_membership(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    vendor = VendorFactory.create()
    store_one = StoreFactory.create(vendor=vendor)
    store_two = StoreFactory.create(vendor=vendor)
    user = UserFactory.create()
    member = VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        active_store=store_one,
        is_primary=True,
    )

    client = APIClient()
    client.force_authenticate(user=user)
    resp = client.post("/api/v1/vendor-stores/select/", {"store": store_two.id}, format="json")
    assert resp.status_code == 200
    member.refresh_from_db()
    assert member.active_store_id == store_two.id


@pytest.mark.django_db
def test_pending_invites_list_and_accept_flow(vendor_admin):
    admin, vendor = vendor_admin
    invitee = UserFactory.create()

    admin_client = APIClient()
    admin_client.force_authenticate(admin)
    invite_resp = admin_client.post("/api/v1/vendor-members/", {"email": invitee.email}, format="json")
    assert invite_resp.status_code == 201
    membership_id = invite_resp.json()["id"]

    invitee_client = APIClient()
    invitee_client.force_authenticate(invitee)

    list_resp = invitee_client.get("/api/v1/vendor-invites/")
    assert list_resp.status_code == 200
    body = list_resp.json()
    results = body["results"] if isinstance(body, dict) and "results" in body else body
    assert len(results) == 1

    accept_resp = invitee_client.post(f"/api/v1/vendor-invites/{membership_id}/accept/")
    assert accept_resp.status_code == 200
    member = VendorMember.objects.get(pk=membership_id)
    assert member.invite_status == VendorMember.InviteStatus.ACCEPTED
    assert member.is_active is True


@pytest.mark.django_db
def test_declining_invite_marks_membership(vendor_admin):
    admin, vendor = vendor_admin
    invitee = UserFactory.create()

    admin_client = APIClient()
    admin_client.force_authenticate(admin)
    invite_resp = admin_client.post("/api/v1/vendor-members/", {"email": invitee.email}, format="json")
    membership_id = invite_resp.json()["id"]

    invitee_client = APIClient()
    invitee_client.force_authenticate(invitee)
    decline_resp = invitee_client.post(f"/api/v1/vendor-invites/{membership_id}/decline/")
    assert decline_resp.status_code == 200
    member = VendorMember.objects.get(pk=membership_id)
    assert member.invite_status == VendorMember.InviteStatus.DECLINED
    assert member.is_active is False

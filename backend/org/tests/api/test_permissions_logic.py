import pytest
from django.test import override_settings

from backend.catalog.tests.factories import StoreFactory, UserFactory, VendorFactory
from backend.org.api.permissions import (
    HasStoreAccess,
    IsVendorAdmin,
    get_active_membership,
    user_has_store_access,
)
from backend.org.models import StoreAccess, StoreAccessRole, VendorMember, VendorMemberRole


@pytest.mark.django_db
def test_get_active_membership_filters_by_vendor():
    vendor_one = VendorFactory.create()
    vendor_two = VendorFactory.create()
    user = UserFactory.create()
    VendorMember.objects.create(user=user, vendor=vendor_one, role=VendorMemberRole.MEMBER, is_active=True)
    target_membership = VendorMember.objects.create(
        user=user, vendor=vendor_two, role=VendorMemberRole.ADMIN, is_active=True
    )

    membership = get_active_membership(user, vendor=vendor_two)
    assert membership == target_membership


@pytest.mark.django_db
def test_user_has_store_access_allows_admins_and_assignments():
    store = StoreFactory.create()
    user = UserFactory.create()
    VendorMember.objects.create(user=user, vendor=store.vendor, role=VendorMemberRole.ADMIN)
    assert user_has_store_access(user, store) is True

    member = VendorMember.objects.create(user=UserFactory.create(), vendor=store.vendor, role=VendorMemberRole.MEMBER)
    assert user_has_store_access(member.user, store) is False

    StoreAccess.objects.create(store=store, member=member, role=StoreAccessRole.SALES)
    assert user_has_store_access(member.user, store) is True


@override_settings(ENABLE_VENDOR_REFACTOR=True)
@pytest.mark.django_db
def test_is_vendor_admin_requires_admin_role():
    store = StoreFactory.create()
    admin_user = UserFactory.create()
    VendorMember.objects.create(user=admin_user, vendor=store.vendor, role=VendorMemberRole.ADMIN)
    request = type("Req", (), {"user": admin_user})
    assert IsVendorAdmin().has_permission(request, view=None) is True

    member_user = UserFactory.create()
    VendorMember.objects.create(user=member_user, vendor=store.vendor, role=VendorMemberRole.MEMBER)
    request = type("Req", (), {"user": member_user})
    assert IsVendorAdmin().has_permission(request, view=None) is False


@override_settings(ENABLE_VENDOR_REFACTOR=True)
@pytest.mark.django_db
def test_has_store_access_validates_request_store():
    store = StoreFactory.create()
    member = VendorMember.objects.create(user=UserFactory.create(), vendor=store.vendor, role=VendorMemberRole.MEMBER)

    request = type("Req", (), {"data": {"store": store.id}, "user": member.user})
    perm = HasStoreAccess()
    assert perm.has_permission(request, view=None) is False

    StoreAccess.objects.create(store=store, member=member, role=StoreAccessRole.MANAGER, is_active=True)
    assert perm.has_permission(request, view=None) is True

import pytest

from backend.core.permissions import VendorScopedPermission
from backend.catalog.tests.factories import CatalogItemFactory, UserFactory, VendorFactory
from backend.org.models import VendorMember, VendorMemberRole


@pytest.mark.django_db
def test_vendor_scoped_permission_allows_owner_vendor():
    vendor = VendorFactory.create()
    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )
    collectible = CatalogItemFactory.create(vendor=vendor, user=user)

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, collectible) is True


@pytest.mark.django_db
def test_vendor_scoped_permission_denies_other_vendor():
    vendor = VendorFactory.create()
    other_vendor = VendorFactory.create()
    user = UserFactory.create()
    VendorMember.objects.create(
        vendor=vendor,
        user=user,
        role=VendorMemberRole.ADMIN,
        is_active=True,
        is_primary=True,
    )
    collectible = CatalogItemFactory.create(vendor=other_vendor)

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, collectible) is False


@pytest.mark.django_db
def test_user_without_vendor_must_own_collectible():
    user = UserFactory.create()
    vendor = VendorFactory.create()
    own_collectible = CatalogItemFactory.create(user=user, vendor=vendor)
    other_collectible = CatalogItemFactory.create()

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, own_collectible) is True
    assert perm.has_object_permission(request, None, other_collectible) is False

import pytest

from backend.core.permissions import VendorScopedPermission
from backend.inventory.tests.factories import CollectibleFactory, UserFactory, VendorFactory
from backend.users.models import UserProfile


@pytest.mark.django_db
def test_vendor_scoped_permission_allows_owner_vendor():
    vendor = VendorFactory.create()
    user = UserFactory.create()
    UserProfile.objects.create(user=user, vendor=vendor)
    collectible = CollectibleFactory.create(vendor=vendor, user=user)

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, collectible) is True


@pytest.mark.django_db
def test_vendor_scoped_permission_denies_other_vendor():
    vendor = VendorFactory.create()
    other_vendor = VendorFactory.create()
    user = UserFactory.create()
    UserProfile.objects.create(user=user, vendor=vendor)
    collectible = CollectibleFactory.create(vendor=other_vendor)

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, collectible) is False


@pytest.mark.django_db
def test_user_without_vendor_must_own_collectible():
    user = UserFactory.create()
    own_collectible = CollectibleFactory.create(user=user, vendor=None)
    other_collectible = CollectibleFactory.create()

    request = type("Request", (), {"user": user})
    perm = VendorScopedPermission()

    assert perm.has_object_permission(request, None, own_collectible) is True
    assert perm.has_object_permission(request, None, other_collectible) is False

import pytest
from django.contrib.auth import get_user_model

from backend.users.models import UserProfile
from backend.vendors.models import Vendor
from backend.vendors.selectors.list_vendors import list_vendors
from backend.vendors.selectors.get_vendor import get_vendor
from backend.vendors.services.create_vendor import create_vendor


User = get_user_model()


@pytest.mark.django_db
def test_list_vendors_scopes_to_user_profile_vendor():
    vendor_a = create_vendor(name="Vendor A")
    vendor_b = create_vendor(name="Vendor B")

    user = User.objects.create_user(username="vendor_user", email="user@example.com", password="Strongpass123")
    UserProfile.objects.create(user=user, vendor=vendor_a)

    scoped = list_vendors(user=user)
    assert list(scoped.values_list("pk", flat=True)) == [vendor_a.pk]

    # Anonymous users get an empty queryset
    assert list_vendors(user=None).count() == 0


@pytest.mark.django_db
def test_get_vendor_respects_scope():
    vendor_a = create_vendor(name="Scoped Vendor")
    vendor_b = create_vendor(name="Other Vendor")

    owner = User.objects.create_user(username="owner", email="owner@example.com", password="Strongpass123")
    stranger = User.objects.create_user(username="stranger", email="stranger@example.com", password="Strongpass123")
    UserProfile.objects.create(user=owner, vendor=vendor_a)
    UserProfile.objects.create(user=stranger, vendor=vendor_b)

    assert get_vendor(user=owner, vendor_id=vendor_a.pk) == vendor_a
    assert get_vendor(user=stranger, vendor_id=vendor_a.pk) is None

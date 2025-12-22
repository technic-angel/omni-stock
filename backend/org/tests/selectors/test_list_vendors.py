import pytest
from django.contrib.auth import get_user_model

from backend.org.selectors.get_vendor import get_vendor
from backend.org.selectors.list_vendors import list_vendors
from backend.org.services.create_vendor import create_vendor

User = get_user_model()


@pytest.mark.django_db
def test_list_vendors_scopes_to_user_profile_vendor():
    vendor_a = create_vendor(name="Vendor A")
    create_vendor(name="Vendor B")

    user = User.objects.create_user(username="vendor_user", email="user@example.com", password="Strongpass123")
    vendor_a.members.create(
        user=user,
        role="admin",
        is_active=True,
        is_primary=True,
    )

    scoped = list_vendors(user=user)
    assert list(scoped.values_list("pk", flat=True)) == [vendor_a.pk]

    # Anonymous users get an empty queryset
    assert list_vendors(user=None).count() == 0


@pytest.mark.django_db
def test_list_vendors_returns_all_active_memberships():
    vendor_a = create_vendor(name="Vendor A")
    vendor_b = create_vendor(name="Vendor B")
    vendor_c = create_vendor(name="Vendor C")

    user = User.objects.create_user(username="multi", email="multi@example.com", password="Strongpass123")

    vendor_a.members.create(user=user, role="admin", is_active=True)
    vendor_b.members.create(user=user, role="member", is_active=True)
    vendor_c.members.create(user=user, role="member", is_active=False)

    scoped = list_vendors(user=user)
    ids = list(scoped.values_list("pk", flat=True))

    assert vendor_a.pk in ids
    assert vendor_b.pk in ids
    assert vendor_c.pk not in ids


@pytest.mark.django_db
def test_get_vendor_respects_scope():
    vendor_a = create_vendor(name="Scoped Vendor")
    vendor_b = create_vendor(name="Other Vendor")

    owner = User.objects.create_user(username="owner", email="owner@example.com", password="Strongpass123")
    stranger = User.objects.create_user(username="stranger", email="stranger@example.com", password="Strongpass123")
    vendor_a.members.create(user=owner, role="admin", is_active=True, is_primary=True)
    vendor_b.members.create(user=stranger, role="admin", is_active=True, is_primary=True)

    assert get_vendor(user=owner, vendor_id=vendor_a.pk) == vendor_a
    assert get_vendor(user=stranger, vendor_id=vendor_a.pk) is None

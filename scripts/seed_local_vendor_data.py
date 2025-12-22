"""
Seed predictable vendor/store data for local development.

Usage:
    docker compose run --rm backend python manage.py shell < scripts/seed_local_vendor_data.py
"""

import os
from datetime import datetime

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.omni_stock.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa  # pylint: disable=wrong-import-position
from django.utils import timezone  # noqa  # pylint: disable=wrong-import-position

from backend.users.models import UserProfile, UserRole  # noqa  # pylint: disable=wrong-import-position
from backend.org.models import (  # noqa  # pylint: disable=wrong-import-position
    Store,
    StoreAccess,
    StoreAccessRole,
    StoreType,
    Vendor,
    VendorMember,
    VendorMemberRole,
)


ADMIN_USERNAME = os.environ.get("SEED_ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.environ.get("SEED_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "1Tsn0tp@sssw0rd")


def ensure_user(username: str, email: str, password: str):
    """Create or update the admin account used for local testing."""
    User = get_user_model()
    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    if created:
        print(f"✅ Created user {username}")

    user.email = email
    user.role = UserRole.ADMIN
    user.is_staff = True
    user.is_superuser = True
    user.set_password(password)
    user.save()
    return user


def ensure_vendor(name: str, description: str, contact_info: str):
    vendor, created = Vendor.objects.get_or_create(
        name=name,
        defaults={
            "description": description,
            "contact_info": contact_info,
        },
    )
    if created:
        print(f"🏪 Created vendor {name}")
    return vendor


def ensure_stores(vendor: Vendor):
    """Create a predictable set of stores that mimic real usage."""
    store_specs = [
        {
            "name": "Flagship Store",
            "type": StoreType.RETAIL,
            "description": "Primary Mellycorp storefront for high-touch sales.",
            "metadata": {"channel": "retail"},
        },
        {
            "name": "Online Marketplace",
            "type": StoreType.ONLINE,
            "description": "Omni-channel eCommerce presence.",
            "metadata": {"channel": "online"},
        },
    ]

    stores = []
    for spec in store_specs:
        store, created = Store.objects.update_or_create(
            vendor=vendor,
            name=spec["name"],
            defaults={
                "type": spec["type"],
                "description": spec["description"],
                "metadata": spec["metadata"],
                "is_active": True,
            },
        )
        stores.append(store)
        action = "Created" if created else "Updated"
        print(f"  • {action} store '{store.name}'")
    return stores


def ensure_membership(user, vendor, stores):
    """Link the admin user to the vendor and grant store access."""
    member, created = VendorMember.objects.get_or_create(
        user=user,
        vendor=vendor,
        defaults={
            "role": VendorMemberRole.OWNER,
            "invite_status": VendorMember.InviteStatus.ACCEPTED,
            "responded_at": timezone.now(),
            "is_active": True,
        },
    )
    if created:
        print("👥 Linked admin user to vendor as owner")
    member.role = VendorMemberRole.OWNER
    member.invite_status = VendorMember.InviteStatus.ACCEPTED
    member.responded_at = member.responded_at or timezone.now()
    member.is_active = True
    member.active_store = stores[0]
    member.save()

    for store in stores:
        StoreAccess.objects.get_or_create(
            store=store,
            member=member,
            defaults={
                "role": StoreAccessRole.MANAGER,
                "permissions": {"can_adjust_price": True, "can_transfer_inventory": True},
            },
        )

    UserProfile.objects.update_or_create(
        user=user,
        defaults={
            "metadata": {
                "seeded_at": datetime.utcnow().isoformat(),
                "default_vendor": vendor.name,
            },
        },
    )


def main():
    admin_user = ensure_user(username=ADMIN_USERNAME, email=ADMIN_EMAIL, password=ADMIN_PASSWORD)

    vendor = ensure_vendor(
        name="Mellycorp",
        description="Collectibles brand used for OmniStock QA.",
        contact_info="Email: ops@mellycorp.test",
    )

    stores = ensure_stores(vendor)

    ensure_membership(admin_user, vendor, stores)

    print("\n🎉 Local vendor/store data ready for testing.")
    print(f"   • Username: {ADMIN_USERNAME}")
    print("   • Password: ********")


main()

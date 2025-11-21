import pytest

from backend.inventory.tests.factories import CollectibleFactory, UserFactory, VendorFactory

from backend.inventory.models import CardDetails, Collectible
from backend.inventory.services.create_item import create_item
from backend.inventory.services.delete_item import delete_item
from backend.inventory.services.update_item import update_item


@pytest.mark.django_db
def test_create_item_with_nested_card_details():
    vendor = VendorFactory.create()
    user = UserFactory.create()

    collectible = create_item(
        data={
            "name": "Service Card",
            "sku": "SRV-001",
            "quantity": 2,
            "vendor": vendor,
            "user": user,
        },
        card_details_data={"language": "English"},
    )

    assert isinstance(collectible, Collectible)
    assert collectible.vendor == vendor
    assert collectible.card_details.language == "English"


@pytest.mark.django_db
def test_update_item_updates_nested_details():
    collectible = CollectibleFactory.create(name="Old", quantity=1)
    CardDetails.objects.filter(collectible=collectible).delete()

    update_item(
        instance=collectible,
        data={"name": "Updated", "quantity": 5},
        card_details_data={"language": "Spanish"},
    )

    collectible.refresh_from_db()
    assert collectible.name == "Updated"
    assert collectible.card_details.language == "Spanish"


@pytest.mark.django_db
def test_delete_item_removes_record():
    collectible = CollectibleFactory.create()
    delete_item(instance=collectible)
    assert not Collectible.objects.filter(pk=collectible.pk).exists()

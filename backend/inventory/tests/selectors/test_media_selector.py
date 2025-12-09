import pytest

from backend.inventory.models import InventoryMedia, InventoryMediaType
from backend.inventory.selectors.media import list_media_for_items
from backend.inventory.tests.factories import CollectibleFactory


@pytest.mark.django_db
def test_list_media_for_items_orders_and_filters_results():
    collectible_one = CollectibleFactory()
    collectible_two = CollectibleFactory()
    other_collectible = CollectibleFactory()

    media_a = InventoryMedia.objects.create(
        item=collectible_one,
        url="https://img.example.com/1-a.jpg",
        media_type=InventoryMediaType.PRIMARY,
        sort_order=2,
        is_primary=True,
    )
    media_b = InventoryMedia.objects.create(
        item=collectible_one,
        url="https://img.example.com/1-b.jpg",
        sort_order=1,
    )
    media_c = InventoryMedia.objects.create(
        item=collectible_two,
        url="https://img.example.com/2-a.jpg",
        sort_order=0,
    )
    InventoryMedia.objects.create(
        item=other_collectible,
        url="https://img.example.com/ignored.jpg",
        sort_order=0,
    )

    results = list(list_media_for_items([collectible_one.id, collectible_two.id]))

    # Only media for the requested collectibles should be returned
    assert {media.item_id for media in results} == {collectible_one.id, collectible_two.id}

    # Results should be ordered by item_id then sort_order (and PK for stability)
    assert [m.pk for m in results] == [media_b.pk, media_a.pk, media_c.pk]

import pytest

from backend.catalog.models import CatalogMedia, CatalogMediaType
from backend.catalog.selectors.media import list_media_for_items
from backend.catalog.tests.factories import CatalogItemFactory


@pytest.mark.django_db
def test_list_media_for_items_orders_and_filters_results():
    collectible_one = CatalogItemFactory()
    collectible_two = CatalogItemFactory()
    other_collectible = CatalogItemFactory()

    media_a = CatalogMedia.objects.create(
        item=collectible_one,
        url="https://img.example.com/1-a.jpg",
        media_type=CatalogMediaType.PRIMARY,
        sort_order=2,
        is_primary=True,
    )
    media_b = CatalogMedia.objects.create(
        item=collectible_one,
        url="https://img.example.com/1-b.jpg",
        sort_order=1,
    )
    media_c = CatalogMedia.objects.create(
        item=collectible_two,
        url="https://img.example.com/2-a.jpg",
        sort_order=0,
    )
    CatalogMedia.objects.create(
        item=other_collectible,
        url="https://img.example.com/ignored.jpg",
        sort_order=0,
    )

    results = list(list_media_for_items([collectible_one.id, collectible_two.id]))

    # Only media for the requested collectibles should be returned
    assert {media.item_id for media in results} == {collectible_one.id, collectible_two.id}

    # Results should be ordered by item_id then sort_order (and PK for stability)
    assert [m.pk for m in results] == [media_b.pk, media_a.pk, media_c.pk]

import pytest

from backend.catalog.services.media import MAX_MEDIA_PER_ITEM, sync_item_media
from backend.catalog.tests.factories import CatalogItemFactory


@pytest.mark.django_db
def test_sync_item_media_replaces_gallery():
    collectible = CatalogItemFactory.create()

    payloads = [
        {"url": "https://cdn.dev/img1.png", "media_type": "primary", "sort_order": 0},
        {"url": "https://cdn.dev/img2.png", "media_type": "gallery", "sort_order": 1},
    ]
    sync_item_media(item=collectible, media_payloads=payloads)

    assert collectible.media.count() == 2
    assert collectible.media.filter(is_primary=True).count() == 1

    sync_item_media(item=collectible, media_payloads=[])
    assert collectible.media.count() == 0


@pytest.mark.django_db
def test_sync_item_media_respects_max_limit():
    collectible = CatalogItemFactory.create()
    payloads = [{"url": f"https://cdn.dev/{idx}.png"} for idx in range(MAX_MEDIA_PER_ITEM + 1)]

    with pytest.raises(ValueError):
        sync_item_media(item=collectible, media_payloads=payloads)


@pytest.mark.django_db
def test_sync_item_media_preserves_existing_when_none():
    collectible = CatalogItemFactory.create()
    sync_item_media(item=collectible, media_payloads=[{"url": "https://cdn.dev/only.png"}])
    assert collectible.media.count() == 1

    sync_item_media(item=collectible, media_payloads=None)
    assert collectible.media.count() == 1


@pytest.mark.django_db
def test_sync_item_media_updates_item_image_url():
    """Verify item.image_url is synced with primary media URL."""
    collectible = CatalogItemFactory.create(image_url=None)
    primary_url = "https://cdn.dev/primary.png"
    
    payloads = [
        {"url": primary_url, "is_primary": True},
        {"url": "https://cdn.dev/gallery.png", "is_primary": False},
    ]
    sync_item_media(item=collectible, media_payloads=payloads)
    
    collectible.refresh_from_db()
    assert collectible.image_url == primary_url

    # Clearing media should clear image_url
    sync_item_media(item=collectible, media_payloads=[])
    collectible.refresh_from_db()
    assert collectible.image_url is None

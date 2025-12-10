import pytest

from backend.inventory.models import ProductImage
from backend.inventory.services.product_images import (
    MAX_PRODUCT_IMAGES,
    sync_product_images,
)
from backend.inventory.tests.factories import CollectibleFactory


@pytest.mark.django_db
def test_sync_product_images_respects_flag(settings):
    settings.ENABLE_VENDOR_REFACTOR = False
    product = CollectibleFactory.create()

    # Should no-op when the feature is disabled.
    sync_product_images(product=product, image_payloads=[{"url": "https://cdn.dev/1.png"}])
    assert not ProductImage.objects.exists()


@pytest.mark.django_db
def test_sync_product_images_creates_rows(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    product = CollectibleFactory.create()

    payloads = [
        {"url": "https://cdn.dev/1.png", "is_primary": True},
        {"url": "https://cdn.dev/2.png", "metadata": {"bucket": "x"}},
    ]
    sync_product_images(product=product, image_payloads=payloads)

    assert ProductImage.objects.filter(product=product).count() == 2
    assert ProductImage.objects.filter(product=product, is_primary=True).count() == 1


@pytest.mark.django_db
def test_sync_product_images_defaults_primary(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    product = CollectibleFactory.create()

    sync_product_images(
        product=product,
        image_payloads=[
            {"url": "https://cdn.dev/first.png"},
            {"url": "https://cdn.dev/second.png"},
        ],
    )

    assert ProductImage.objects.get(product=product, is_primary=True).url.endswith("first.png")


@pytest.mark.django_db
def test_sync_product_images_enforces_limit(settings):
    settings.ENABLE_VENDOR_REFACTOR = True
    product = CollectibleFactory.create()

    with pytest.raises(ValueError):
        sync_product_images(
            product=product,
            image_payloads=[{"url": f"https://cdn.dev/{idx}.png"} for idx in range(MAX_PRODUCT_IMAGES + 1)],
        )

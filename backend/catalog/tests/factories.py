from decimal import Decimal

import factory
from django.contrib.auth import get_user_model

from backend.catalog.models import CardMetadata, CatalogItem, CatalogVariant
from backend.org.models import Store, Vendor

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")


class VendorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Vendor

    name = factory.Sequence(lambda n: f"Vendor {n}")


class StoreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Store

    vendor = factory.SubFactory(VendorFactory)
    name = factory.Sequence(lambda n: f"Store {n}")


class CatalogItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CatalogItem

    name = factory.Sequence(lambda n: f"Card {n}")
    sku = factory.Sequence(lambda n: f"SKU-{n:03d}")
    quantity = 1
    category = "Cards"
    condition = "Near Mint"
    intake_price = Decimal("5.00")
    price = Decimal("10.00")
    projected_price = Decimal("12.00")
    vendor = factory.SubFactory(VendorFactory)
    store = factory.SubFactory(StoreFactory, vendor=factory.SelfAttribute("..vendor"))


class CardMetadataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CardMetadata

    item = factory.SubFactory(CatalogItemFactory)
    language = factory.Faker('language_name')
    release_date = factory.Faker('date')
    print_run = factory.Sequence(lambda n: f'Print run {n}')
    market_region = factory.Faker('country')


class CatalogVariantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CatalogVariant

    item = factory.SubFactory(CatalogItemFactory)
    condition = factory.Iterator(["Raw", "PSA 10"])
    grade = factory.Faker("word")
    quantity = 1
    price_adjustment = Decimal("1.00")

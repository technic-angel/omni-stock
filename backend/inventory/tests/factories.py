import factory
from django.contrib.auth import get_user_model

from backend.inventory.models import CardDetails, Collectible
from backend.vendors.models import Vendor


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


class CollectibleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Collectible

    name = factory.Sequence(lambda n: f"Card {n}")
    sku = factory.Sequence(lambda n: f"SKU-{n:03d}")
    quantity = 1
    vendor = factory.SubFactory(VendorFactory)


class CardDetailsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CardDetails

    collectible = factory.SubFactory(CollectibleFactory)
    language = factory.Faker('language_name')
    release_date = factory.Faker('date')
    print_run = factory.Sequence(lambda n: f'Print run {n}')
    market_region = factory.Faker('country')

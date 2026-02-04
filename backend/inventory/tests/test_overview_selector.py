from backend.catalog.tests.factories import CatalogItemFactory, StoreFactory, VendorFactory, UserFactory
from backend.org.models import VendorMember
from backend.inventory.selectors.overview import get_inventory_overview


def test_get_inventory_overview_counts_and_store_breakdown(db):
    user = UserFactory()
    vendor = VendorFactory()
    # attach membership
    VendorMember.objects.create(user=user, vendor=vendor, is_active=True, is_primary=True)

    store_a = StoreFactory(vendor=vendor, name="A Store")
    store_b = StoreFactory(vendor=vendor, name="B Store")

    # items across stores
    CatalogItemFactory(vendor=vendor, store=store_a, quantity=10)
    CatalogItemFactory(vendor=vendor, store=store_a, quantity=3)
    CatalogItemFactory(vendor=vendor, store=store_b, quantity=0)

    overview = get_inventory_overview(user=user)
    assert overview["stats"]["totalSkus"] == 3
    assert overview["stats"]["totalUnits"] == 13
    # low stock: quantity >0 and <=5 => only one item
    assert overview["stats"]["lowStock"] == 1
    assert len(overview["stores"]) == 2
    # find store A summary
    store_a_summary = next(s for s in overview["stores"] if s["name"] == "A Store")
    assert store_a_summary["totalSkus"] == 2
    assert store_a_summary["unitsOnHand"] == 13 - 0

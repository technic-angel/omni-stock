from backend.catalog.tests.factories import (
    CatalogItemFactory,
    StoreFactory,
    UserFactory,
    VendorFactory,
)
from backend.inventory.selectors.overview import get_inventory_overview
from backend.org.models import VendorMember


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


def test_get_inventory_overview_financial_metrics(db):
    user = UserFactory()
    vendor = VendorFactory()
    # attach membership
    VendorMember.objects.create(user=user, vendor=vendor, is_active=True, is_primary=True)
    store = StoreFactory(vendor=vendor)

    # 10 items at $10 each, cost $5 each
    CatalogItemFactory(
        vendor=vendor,
        store=store,
        quantity=10,
        price=10.00,
        intake_price=5.00,
        category="pokemon_card",
    )
    # 5 items at $20 each, cost $15 each
    CatalogItemFactory(
        vendor=vendor,
        store=store,
        quantity=5,
        price=20.00,
        intake_price=15.00,
        category="video_game",
    )

    overview = get_inventory_overview(user=user)

    # Portfolio Value: (10 * 10) + (5 * 20) = 100 + 100 = 200
    assert overview["stats"]["portfolioValue"] == 200.00
    # Acquisition Cost: (10 * 5) + (5 * 15) = 50 + 75 = 125
    assert overview["stats"]["acquisitionCost"] == 125.00

    # Category Breakdown
    assert len(overview["categoryBreakdown"]) == 2
    pokemon = next(c for c in overview["categoryBreakdown"] if c["category"] == "pokemon_card")
    assert pokemon["count"] == 1
    assert pokemon["value"] == 100.00
    video_game = next(c for c in overview["categoryBreakdown"] if c["category"] == "video_game")
    assert video_game["count"] == 1
    assert video_game["value"] == 100.00

    # Top Items
    assert len(overview["topItems"]) == 2
    # Pokemon card comes first because they are both $100 value but ties handled by price/name
    assert overview["topItems"][0]["value"] == 100.00
    assert overview["topItems"][1]["value"] == 100.00


def test_get_inventory_overview_no_vendor(db):
    user = UserFactory()
    # No VendorMember created for this user
    overview = get_inventory_overview(user=user)

    assert overview["stats"]["totalSkus"] == 0
    assert overview["categoryBreakdown"] == []
    assert overview["topItems"] == []
    assert overview["stores"] == []

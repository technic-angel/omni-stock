import pytest

from rest_framework.test import APIClient


@pytest.mark.django_db
def test_collectible_list_includes_card_details():
    """List endpoint should include a nested `card_details` object with release metadata."""
    from collectibles.tests.factories import CollectibleFactory, CardDetailsFactory, UserFactory
    from collectibles.models import UserProfile

    client = APIClient()

    # create a collectible and attach CardDetails
    collectible = CollectibleFactory.create(name="Card With Details", sku="DETAIL-001")
    details = CardDetailsFactory.create(collectible=collectible, language="Spanish", market_region="Spain")

    # prepare and authenticate a user attached to the same vendor
    user = UserFactory.create(username="api_tester")
    UserProfile.objects.create(user=user, vendor=collectible.vendor)
    client.force_authenticate(user=user)

    url = "/api/v1/collectibles/"
    resp = client.get(url)
    assert resp.status_code == 200

    data = resp.json()
    # find our collectible in the list by sku
    found = [c for c in data if c.get("sku") == "DETAIL-001"]
    assert found, "Created collectible not present in list response"
    cd = found[0].get("card_details")
    assert cd is not None, "card_details should be present in list response"
    assert cd.get("language") == "Spanish"
    assert cd.get("market_region") == "Spain"


@pytest.mark.django_db
def test_filter_collectibles_by_card_language():
    """Support filtering collectibles by nested CardDetails.language (TDD: may fail until implemented)."""
    from collectibles.tests.factories import CollectibleFactory, CardDetailsFactory, UserFactory
    from collectibles.models import UserProfile

    client = APIClient()

    c1 = CollectibleFactory.create(name="Lang Card 1", sku="LANG-1")
    CardDetailsFactory.create(collectible=c1, language="English")

    c2 = CollectibleFactory.create(name="Lang Card 2", sku="LANG-2", vendor=c1.vendor)
    CardDetailsFactory.create(collectible=c2, language="Japanese")

    user = UserFactory.create(username="filter_tester")
    UserProfile.objects.create(user=user, vendor=c1.vendor)
    client.force_authenticate(user=user)

    url = "/api/v1/collectibles/?language=English"
    resp = client.get(url)
    assert resp.status_code == 200

    data = resp.json()
    # Expect only the English-language collectible to be returned
    skus = [c.get("sku") for c in data]
    assert "LANG-1" in skus
    assert "LANG-2" not in skus


@pytest.mark.django_db
def test_create_collectible_with_nested_card_details():
    """Creating a Collectible with nested `card_details` should create the related row."""
    from collectibles.tests.factories import UserFactory, VendorFactory
    from collectibles.models import UserProfile, Collectible

    client = APIClient()

    vendor = VendorFactory.create(name="Nested Vendor")
    user = UserFactory.create(username="nested_creator")
    UserProfile.objects.create(user=user, vendor=vendor)
    client.force_authenticate(user=user)

    payload = {
        "name": "Created With Details",
        "sku": "NEST-001",
        "quantity": 2,
        "card_details": {
            "language": "Italian",
            "market_region": "Italy",
            "notes": "Test nested create",
        },
    }

    resp = client.post("/api/v1/collectibles/", payload, format='json')
    assert resp.status_code in (200, 201)

    c = Collectible.objects.get(sku="NEST-001")
    assert hasattr(c, 'card_details')
    assert c.card_details.language == "Italian"


@pytest.mark.django_db
def test_update_collectible_nested_card_details():
    """PATCHing the Collectible with nested `card_details` should update the CardDetails."""
    from collectibles.tests.factories import CollectibleFactory, CardDetailsFactory, UserFactory
    from collectibles.models import UserProfile

    client = APIClient()

    collectible = CollectibleFactory.create(name="Updatable", sku="UPD-1")
    CardDetailsFactory.create(collectible=collectible, language="German")

    user = UserFactory.create(username="upd_tester")
    UserProfile.objects.create(user=user, vendor=collectible.vendor)
    client.force_authenticate(user=user)

    resp = client.patch(f"/api/v1/collectibles/{collectible.pk}/", {"card_details": {"language": "Dutch"}}, format='json')
    assert resp.status_code in (200, 204)

    collectible.refresh_from_db()
    assert collectible.card_details.language == "Dutch"


def _schema_collectible_component(schema: dict):
    """Helper to locate the Collectible schema component in the generated OpenAPI schema."""
    # drf-spectacular typically exposes model schemas under components->schemas
    components = schema.get('components', {}).get('schemas', {})
    # Try several likely keys
    for key in ('Collectible', 'collectible', 'core_api_collectible'):
        if key in components:
            return components[key]
    # If not present, return None so tests can fail clearly
    return None


@pytest.mark.django_db
def test_openapi_includes_writable_card_details():
    """The generated OpenAPI schema should include `card_details` as a writable property on Collectible."""
    from drf_spectacular.generators import SchemaGenerator

    generator = SchemaGenerator()
    schema = generator.get_schema(request=None, public=True)

    comp = _schema_collectible_component(schema)
    assert comp is not None, "Collectible component not found in generated schema"
    props = comp.get('properties', {})
    assert 'card_details' in props
    # Ensure card_details is not marked readOnly in the schema (we support writes)
    cd = props['card_details']
    assert cd.get('readOnly') is not True

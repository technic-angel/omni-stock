"""
Test suite for API authentication, authorization, and input validation.

This module covers:
- Authentication requirements for all endpoints
- Vendor isolation and multi-tenancy
- Input validation and error handling
- JWT token authentication flow
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from backend.inventory.models import Collectible
from backend.inventory.tests.factories import CollectibleFactory, UserFactory, VendorFactory
from backend.inventory.tests.utils import ensure_vendor_admin
from backend.users.models import UserProfile

User = get_user_model()


def attach_vendor_profile(user, vendor=None):
    vendor, store = ensure_vendor_admin(user, vendor)
    return vendor, store


class TestAuthenticationRequirements:
    """Test that all inventory endpoints require authentication."""
    
    @pytest.mark.django_db
    def test_list_requires_authentication(self):
        CollectibleFactory.create(sku="AUTH-001")
        client = APIClient()
        
        resp = client.get("/api/v1/collectibles/")
        assert resp.status_code == 401

    @pytest.mark.django_db
    def test_create_requires_authentication(self):
        client = APIClient()
        payload = {"name": "Test", "sku": "AUTH-002", "quantity": 1}
        
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        assert resp.status_code == 401

    @pytest.mark.django_db
    def test_update_requires_authentication(self):
        collectible = CollectibleFactory.create(sku="AUTH-003")
        client = APIClient()
        
        resp = client.patch(f"/api/v1/collectibles/{collectible.pk}/", {"name": "Hacked"}, format="json")
        assert resp.status_code == 401

    @pytest.mark.django_db
    def test_delete_requires_authentication(self):
        collectible = CollectibleFactory.create(sku="AUTH-004")
        client = APIClient()
        
        resp = client.delete(f"/api/v1/collectibles/{collectible.pk}/")
        assert resp.status_code == 401
        assert Collectible.objects.filter(pk=collectible.pk).exists()


class TestVendorIsolation:
    """Test multi-tenant vendor scoping."""
    
    @pytest.mark.django_db
    def test_users_only_see_own_vendor_items(self):
        vendor1 = VendorFactory.create(name="Vendor A")
        vendor2 = VendorFactory.create(name="Vendor B")
        
        user1 = UserFactory.create(username="user_a")
        UserProfile.objects.create(user=user1, vendor=vendor1)
        
        CollectibleFactory.create(vendor=vendor1, sku="V1-ITEM")
        CollectibleFactory.create(vendor=vendor2, sku="V2-ITEM")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        resp = client.get("/api/v1/collectibles/")
        assert resp.status_code == 200
        
        skus = [item["sku"] for item in resp.json()]
        assert "V1-ITEM" in skus
        assert "V2-ITEM" not in skus

    @pytest.mark.django_db
    def test_cross_vendor_update_blocked(self):
        vendor1 = VendorFactory.create()
        vendor2 = VendorFactory.create()
        
        user1 = UserFactory.create()
        UserProfile.objects.create(user=user1, vendor=vendor1)
        
        item = CollectibleFactory.create(vendor=vendor2, sku="OTHER-001", name="Original")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        resp = client.patch(
            f"/api/v1/collectibles/{item.pk}/",
            {"name": "Hacked"},
            format="json"
        )
        assert resp.status_code == 404
        
        item.refresh_from_db()
        assert item.name == "Original"

    @pytest.mark.django_db
    def test_cross_vendor_delete_blocked(self):
        vendor1 = VendorFactory.create()
        vendor2 = VendorFactory.create()
        
        user1 = UserFactory.create()
        UserProfile.objects.create(user=user1, vendor=vendor1)
        
        item = CollectibleFactory.create(vendor=vendor2, sku="OTHER-002")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        resp = client.delete(f"/api/v1/collectibles/{item.pk}/")
        assert resp.status_code == 404
        assert Collectible.objects.filter(pk=item.pk).exists()


class TestInputValidation:
    """Test request validation and error handling."""
    
    @pytest.mark.django_db
    def test_sku_is_required(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {"name": "Test Item", "quantity": 1, "store": store.id}
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 400
        assert "sku" in resp.json()

    @pytest.mark.django_db
    def test_sku_uniqueness_enforced(self):
        CollectibleFactory.create(sku="DUP-001")
        
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {"name": "Duplicate", "sku": "DUP-001", "quantity": 1, "store": store.id}
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 400
        assert "sku" in str(resp.json()).lower()

    @pytest.mark.django_db
    def test_negative_quantity_rejected(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {"name": "Bad Qty", "sku": "NEG-001", "quantity": -5, "store": store.id}
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_negative_prices_rejected(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {
            "name": "Bad Price",
            "sku": "NEG-PRICE-001",
            "quantity": 1,
            "price": "-10.50",
            "store": store.id,
        }
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_decimal_prices_accepted(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)

        client = APIClient()
        client.force_authenticate(user=user)

        payload = {
            "name": "Valid Price",
            "sku": "PRICE-001",
            "quantity": 1,
            "intake_price": "12.99",
            "price": "19.99",
            "projected_price": "25.00",
            "store": store.id,
        }
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 201
        item = Collectible.objects.get(sku="PRICE-001")
        assert item.intake_price == Decimal("12.99")
        assert item.price == Decimal("19.99")
        assert item.projected_price == Decimal("25.00")

    @pytest.mark.django_db
    def test_invalid_image_url_rejected(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {
            "name": "Bad URL",
            "sku": "URL-001",
            "quantity": 1,
            "image_url": "not-a-valid-url",
            "store": store.id,
        }
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 400


class TestStatusCodes:
    """Test HTTP status code correctness."""
    
    @pytest.mark.django_db
    def test_create_returns_201(self):
        user = UserFactory.create()
        _, store = attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        payload = {"name": "New Item", "sku": "STATUS-201", "quantity": 1, "store": store.id}
        resp = client.post("/api/v1/collectibles/", payload, format="json")
        
        assert resp.status_code == 201

    @pytest.mark.django_db
    def test_list_returns_200(self):
        user = UserFactory.create()
        attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        resp = client.get("/api/v1/collectibles/")
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_update_returns_200(self):
        user = UserFactory.create()
        vendor = VendorFactory.create()
        _, store = attach_vendor_profile(user, vendor)

        item = CollectibleFactory.create(vendor=vendor, user=user, sku="UPD-200", store=store)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        resp = client.patch(
            f"/api/v1/collectibles/{item.pk}/",
            {"name": "Updated"},
            format="json"
        )
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_delete_returns_204(self):
        user = UserFactory.create()
        vendor = VendorFactory.create()
        _, store = attach_vendor_profile(user, vendor)

        item = CollectibleFactory.create(vendor=vendor, user=user, sku="DEL-204", store=store)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        resp = client.delete(f"/api/v1/collectibles/{item.pk}/")
        assert resp.status_code == 204

    @pytest.mark.django_db
    def test_nonexistent_item_returns_404(self):
        user = UserFactory.create()
        attach_vendor_profile(user)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        resp = client.get("/api/v1/collectibles/999999/")
        assert resp.status_code == 404


class TestUserRegistration:
    """Test user registration endpoint."""
    
    @pytest.mark.django_db
    def test_registration_creates_profile(self):
        client = APIClient()
        
        payload = {
            "username": "newuser",
            "password": "securepass123",
            "email": "new@example.com",
            "birthdate": "1990-01-01",
        }
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        
        assert resp.status_code == 201
        assert User.objects.filter(username="newuser").exists()
        
        user = User.objects.get(username="newuser")
        assert hasattr(user, "profile")
        assert UserProfile.objects.filter(user=user).exists()

    @pytest.mark.django_db
    def test_duplicate_username_rejected(self):
        UserFactory.create(username="taken")
        
        client = APIClient()
        payload = {
            "username": "taken",
            "password": "password123"
        }
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_password_length_validated(self):
        client = APIClient()
        
        payload = {
            "username": "shortpass",
            "password": "short"
        }
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        
        assert resp.status_code == 400
        assert "password" in str(resp.json()).lower()


class TestJWTAuthentication:
    """Test JWT token authentication flow."""
    
    @pytest.mark.django_db
    def test_valid_credentials_return_tokens(self):
        user = UserFactory.create(username="tokenuser")
        user.set_password("testpass123")
        user.save()
        
        client = APIClient()
        payload = {"username": "tokenuser", "password": "testpass123"}
        resp = client.post("/api/v1/auth/token/", payload, format="json")
        
        assert resp.status_code == 200
        data = resp.json()
        assert "access" in data
        assert "refresh" in data

    @pytest.mark.django_db
    def test_invalid_credentials_rejected(self):
        user = UserFactory.create(username="tokenuser")
        user.set_password("correctpass")
        user.save()
        
        client = APIClient()
        payload = {"username": "tokenuser", "password": "wrongpass"}
        resp = client.post("/api/v1/auth/token/", payload, format="json")
        
        assert resp.status_code == 401

    @pytest.mark.django_db
    def test_token_refresh_flow(self):
        user = UserFactory.create(username="refreshuser")
        user.set_password("testpass123")
        user.save()
        
        client = APIClient()
        
        payload = {"username": "refreshuser", "password": "testpass123"}
        resp = client.post("/api/v1/auth/token/", payload, format="json")
        refresh_token = resp.json()["refresh"]
        
        resp = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh_token}, format="json")
        
        assert resp.status_code == 200
        assert "access" in resp.json()

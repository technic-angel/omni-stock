"""Vendor domain viewsets."""

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from backend.core.permissions import resolve_user_vendor
from backend.vendors.api.permissions import IsVendorAdmin
from backend.vendors.api.serializers import (
    StoreAccessSerializer,
    StoreSerializer,
    VendorMemberInviteSerializer,
    VendorMemberSerializer,
    VendorMemberUpdateSerializer,
    VendorSerializer,
)
from backend.vendors.models import Store, StoreAccess, Vendor, VendorMember, VendorMemberRole
from backend.vendors.selectors.get_vendor import get_vendor
from backend.vendors.selectors.list_vendors import list_vendors
from backend.vendors.services.memberships import (
    accept_invite,
    assign_store_access,
    create_store,
    deactivate_membership,
    decline_invite,
    invite_member,
    remove_store_access,
    update_membership_role,
    update_store,
)


class VendorViewSet(viewsets.ModelViewSet):
    """Vendor CRUD with basic scoping to the user's vendor profile."""

    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_vendors(user=getattr(self.request, "user", None))

    def get_object(self):
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value is None:
            raise NotFound("Vendor identifier is missing.")
        vendor = get_vendor(user=self.request.user, vendor_id=lookup_value)
        if vendor is None:
            raise PermissionDenied("You do not have access to this vendor.")
        return vendor

    def perform_create(self, serializer):
        vendor = serializer.save()
        self._attach_user_profile_vendor(vendor)

    def perform_update(self, serializer):
        serializer.save()

    def _attach_user_profile_vendor(self, vendor: Vendor):
        profile_vendor = resolve_user_vendor(self.request.user)
        if profile_vendor is None:
            profile = getattr(self.request.user, "profile", None)
            if profile is not None:
                profile.vendor = vendor
                profile.save(update_fields=["vendor"])


class VendorFeatureFlagMixin:
    """Gate new viewsets behind the vendor refactor flag."""

    def initial(self, request, *args, **kwargs):
        if not getattr(settings, "ENABLE_VENDOR_REFACTOR", False):
            raise NotFound("Vendor stores feature is not enabled.")
        super().initial(request, *args, **kwargs)

    def _require_vendor(self):
        vendor = resolve_user_vendor(self.request.user)
        if vendor is None:
            raise PermissionDenied("You must belong to a vendor to perform this action.")
        return vendor


class VendorMemberViewSet(VendorFeatureFlagMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsVendorAdmin]
    queryset = VendorMember.objects.none()

    def get_queryset(self):
        vendor = self._require_vendor()
        return VendorMember.objects.filter(vendor=vendor).select_related("user")

    def get_serializer_class(self):
        if self.request.method in ("POST",):
            return VendorMemberInviteSerializer
        if self.action in ("update", "partial_update"):
            return VendorMemberUpdateSerializer
        return VendorMemberSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = self._require_vendor()
        data = serializer.validated_data
        member = invite_member(
            vendor=vendor,
            email=data["email"],
            role=data.get("role", VendorMemberRole.MEMBER),
            invited_by=request.user,
        )
        title = data.get("title")
        if title:
            member.title = title
            member.save(update_fields=["title"])
        output = VendorMemberSerializer(member)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        member = serializer.instance
        data = serializer.validated_data
        if "role" in data:
            update_membership_role(member=member, role=data["role"])
        if "title" in data:
            member.title = data["title"]
            member.save(update_fields=["title"])
        if data.get("is_active") is False:
            deactivate_membership(member=member)
        serializer.instance = member

    def perform_destroy(self, instance):
        deactivate_membership(member=instance)


class VendorInviteViewSet(
    VendorFeatureFlagMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = VendorMemberSerializer
    queryset = VendorMember.objects.none()

    def get_queryset(self):
        base_qs = VendorMember.objects.select_related("vendor", "user")
        if self.request.user.is_authenticated:
            return (
                base_qs.filter(
                    user=self.request.user,
                    invite_status=VendorMember.InviteStatus.PENDING,
                )
                .order_by("-invited_at")
            )
        return base_qs.none()

    def _get_membership(self, pk):
        return get_object_or_404(self.get_queryset(), pk=pk)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        membership = self._get_membership(pk)
        accept_invite(member=membership)
        return Response(VendorMemberSerializer(membership).data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        membership = self._get_membership(pk)
        decline_invite(member=membership)
        return Response(VendorMemberSerializer(membership).data)


class StoreViewSet(VendorFeatureFlagMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsVendorAdmin]
    serializer_class = StoreSerializer
    queryset = Store.objects.none()

    def get_queryset(self):
        vendor = self._require_vendor()
        return Store.objects.filter(vendor=vendor)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = self._require_vendor()
        store = create_store(vendor=vendor, **serializer.validated_data)
        output = self.get_serializer(store)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        store = serializer.instance
        serializer.instance = update_store(store=store, **serializer.validated_data)


class StoreAccessViewSet(VendorFeatureFlagMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsVendorAdmin]
    serializer_class = StoreAccessSerializer
    queryset = StoreAccess.objects.none()

    def get_queryset(self):
        vendor = self._require_vendor()
        return StoreAccess.objects.filter(store__vendor=vendor).select_related("member__user", "store")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = self._require_vendor()
        data = serializer.validated_data
        store = data["store"]
        member = data["member"]
        if store.vendor_id != vendor.id or member.vendor_id != vendor.id:
            raise PermissionDenied("Store and member must belong to your vendor.")
        access = assign_store_access(store=store, member=member, role=data.get("role"))
        output = self.get_serializer(access)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        access = serializer.instance
        role = serializer.validated_data.get("role")
        if role:
            access.role = role
            access.save(update_fields=["role", "updated_at"])
        serializer.instance = access

    def perform_destroy(self, instance):
        remove_store_access(store=instance.store, member=instance.member)


__all__ = ["VendorViewSet", "VendorMemberViewSet", "VendorInviteViewSet", "StoreViewSet", "StoreAccessViewSet"]

from django.contrib import admin
import admin_thumbnails  # For generating thumbnail previews in the admin interface

from .models import Collectible, Vendor, UserProfile, CardDetails


class CardDetailsInline(admin.StackedInline):
    model = CardDetails
    extra = 0
    can_delete = False


@admin_thumbnails.thumbnail('image')
class CollectibleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'sku',
        'image_thumbnail',
        'quantity',
        'current_price',
        'user',
        'last_updated',
    )

    search_fields = ('name', 'sku', 'description', 'location')
    list_filter = ('vendor', 'user', 'location', 'last_updated')

    fieldsets = (
        ('Owner & Identification', {
            'fields': ('vendor', 'user', 'name', 'sku'),
        }),
        ('Inventory & Location', {
            'fields': ('location', 'quantity', 'image', 'image_thumbnail'),
            'classes': ('collapse',),
        }),
        ('Pricing & Financials', {
            'fields': ('intake_price', 'current_price', 'projected_price'),
            'classes': ('collapse',),
        }),
        ('Details', {
            'fields': ('description',),
            'classes': ('collapse',),
        })
    )

    readonly_fields = ('last_updated', 'image_thumbnail',)
    inlines = [CardDetailsInline]

    def save_model(self, request, obj, form, change):
        # Only set owner on create if it's not already provided
        if not obj.pk:
            if not getattr(obj, 'user', None):
                obj.user = request.user
        super().save_model(request, obj, form, change)


admin.site.register(Collectible, CollectibleAdmin)
admin.site.register(Vendor)
admin.site.register(UserProfile)
from django.contrib import admin
<<<<<<< HEAD
from django.contrib import admin
import admin_thumbnails  # For generating thumbnail previews in the admin interface

from .models import Collectible, Vendor, UserProfile, CardDetails


class CardDetailsInline(admin.StackedInline):
    model = CardDetails
    extra = 0
    can_delete = False


@admin_thumbnails.thumbnail('image')
class CollectibleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'sku',
        'image_thumbnail',
        'quantity',
        'current_price',
        'user',
        'last_updated',
    )

    search_fields = ('name', 'sku', 'description', 'location')
    list_filter = ('vendor', 'user', 'location', 'last_updated')

    fieldsets = (
        ('Owner & Identification', {
            'fields': ('vendor', 'user', 'name', 'sku'),
        }),
        ('Inventory & Location', {
            'fields': ('location', 'quantity', 'image', 'image_thumbnail'),
            'classes': ('collapse',),
        }),
        ('Pricing & Financials', {
            'fields': ('intake_price', 'current_price', 'projected_price'),
            'classes': ('collapse',),
        }),
        ('Details', {
            'fields': ('description',),
            'classes': ('collapse',),
        })
    )

    readonly_fields = ('last_updated', 'image_thumbnail',)
    inlines = [CardDetailsInline]

    def save_model(self, request, obj, form, change):
        # Only set owner on create if it's not already provided
        if not obj.pk:
            if not getattr(obj, 'user', None):
                obj.user = request.user
        super().save_model(request, obj, form, change)


admin.site.register(Collectible, CollectibleAdmin)
admin.site.register(Vendor)
admin.site.register(UserProfile)

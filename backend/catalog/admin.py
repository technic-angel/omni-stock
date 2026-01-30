from django.contrib import admin

from backend.catalog.models import (
    Accessory,
    CardMetadata,
    CatalogItem,
    CatalogVariant,
    Era,
    Product,
    Set,
)


class CardMetadataInline(admin.StackedInline):
    model = CardMetadata
    can_delete = False
    verbose_name = 'Card Details'
    extra = 0


class CatalogVariantInline(admin.TabularInline):
    model = CatalogVariant
    extra = 0
    fields = ("condition", "grade", "quantity", "price_adjustment")


class CatalogItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'sku',
        'quantity',
        'price',
        'vendor',
        'updated_at',
    )
    search_fields = ('name', 'sku', 'description', 'category', 'condition')
    list_filter = ('vendor', 'category', 'condition')
    fieldsets = (
        ('Owner & Identification', {'fields': ('user', 'vendor', 'name', 'sku')}),
        ('Inventory & Presentation', {'fields': ('product', 'quantity', 'image_url', 'category', 'condition')}),
        (
            'Pricing & Financials',
            {
                'fields': ('intake_price', 'price', 'projected_price'),
                'classes': ('collapse',),
            },
        ),
        ('Details', {'fields': ('description',), 'classes': ('collapse',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    inlines = (CardMetadataInline, CatalogVariantInline)

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


admin.site.register(CatalogItem, CatalogItemAdmin)
admin.site.register(CatalogVariant)

@admin.register(Era)
class EraAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_year', 'end_year')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Set)
class SetAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'era', 'release_date')
    search_fields = ('name', 'code')
    list_filter = ('era',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'set', 'release_date')
    search_fields = ('name',)
    list_filter = ('type', 'set')


@admin.register(Accessory)
class AccessoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')
    search_fields = ('name', 'type')
    list_filter = ('type',)

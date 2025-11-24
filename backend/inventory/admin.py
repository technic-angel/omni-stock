from django.contrib import admin

from backend.inventory.models import CardDetails, Collectible


class CardDetailsInline(admin.StackedInline):
    model = CardDetails
    can_delete = False
    verbose_name = 'Card Details'
    extra = 0


class CollectibleAdmin(admin.ModelAdmin):
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
        ('Inventory & Presentation', {'fields': ('quantity', 'image_url', 'category', 'condition')}),
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
    inlines = (CardDetailsInline,)

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


admin.site.register(Collectible, CollectibleAdmin)

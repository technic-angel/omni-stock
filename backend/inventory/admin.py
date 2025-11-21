from django.contrib import admin

from backend.inventory.models import CardDetails, Collectible
import admin_thumbnails


class CardDetailsInline(admin.StackedInline):
    model = CardDetails
    can_delete = False
    verbose_name = 'Card Details'
    extra = 0


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
    list_filter = ('user', 'location', 'last_updated')
    fieldsets = (
        ('Owner & Identification', {'fields': ('user', 'name', 'sku')}),
        ('Inventory & Location', {'fields': ('location', 'quantity', 'image')}),
        (
            'Pricing & Financials',
            {
                'fields': ('intake_price', 'current_price', 'projected_price'),
                'classes': ('collapse',),
            },
        ),
        ('Details', {'fields': ('description',), 'classes': ('collapse',)}),
    )
    readonly_fields = ('last_updated', 'image_thumbnail')
    inlines = (CardDetailsInline,)

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


admin.site.register(Collectible, CollectibleAdmin)

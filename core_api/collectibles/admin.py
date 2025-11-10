from django.contrib import admin
from .models import Collectible
import admin_thumbnails # Import the package we just installed

# Define the custom Admin class for the Collectible model
@admin_thumbnails.thumbnail('image')  # Apply the thumbnail decorator to the 'image' field
class CollectibleAdmin(admin.ModelAdmin):
    # Fields to display in the main list view
    list_display = (
        'name',
        'sku',
        'image_thumbnail',  # decorator creates '<field>_thumbnail'
        'quantity',
        'current_price',
        'user',
        'last_updated',
    )

    # Fields that can be searched
    search_fields = ('name', 'sku', 'description', 'location')

    # Fields to use as filters on the right sidebar
    list_filter = ('user', 'location', 'last_updated')

    # Fields to display in the edit form, grouped logically
    fieldsets = (
        ('Owner & Identification', {
            'fields': ('user', 'name', 'sku'),
        }),
        ('Inventory & Location', {
            'fields': ('location', 'quantity', 'image'),  # Removed image_thumbnail from fieldset
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

    # Set read-only fields (thumbnail is generated)
    readonly_fields = ('last_updated', 'image_thumbnail',)

    # Ensure the 'user' field is automatically set to the current user
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Only on creation
            if not obj.user:
                obj.user = request.user
        super().save_model(request, obj, form, change)


# Register the model with the custom Admin class
admin.site.register(Collectible, CollectibleAdmin)
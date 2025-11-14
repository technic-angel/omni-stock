"""Add indexes on CardDetails.language and CardDetails.market_region (lowercased).

Generated manually to improve filter performance on case-insensitive lookups.
"""
from django.db import migrations
from django.db.models import Index
from django.db.models.functions import Lower


class Migration(migrations.Migration):

    dependencies = [
        ("collectibles", "0003_vendor_carddetails_userprofile_collectible_vendor"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="carddetails",
            index=Index(Lower("language"), name="carddetails_language_lwr_idx"),
        ),
        migrations.AddIndex(
            model_name="carddetails",
            index=Index(Lower("market_region"), name="carddetails_market_lwr_idx"),
        ),
    ]

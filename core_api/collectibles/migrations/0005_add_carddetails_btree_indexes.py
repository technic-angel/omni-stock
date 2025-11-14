from django.db import migrations
from django.db.models import Index


class Migration(migrations.Migration):
    dependencies = [
        ("collectibles", "0004_add_carddetails_indexes"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="carddetails",
            index=Index(fields=["language"], name="carddetails_language_btree_idx"),
        ),
        migrations.AddIndex(
            model_name="carddetails",
            index=Index(fields=["market_region"], name="carddetails_market_btree_idx"),
        ),
    ]

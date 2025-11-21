from django.db import migrations


class Migration(migrations.Migration):
    # Concurrent index creation cannot run inside a transaction
    atomic = False

    dependencies = [
        ("collectibles", "0006_add_carddetails_externalids_gin"),
        ("collectibles", "0005_add_carddetails_btree_indexes"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS carddetails_language_btree_idx
                ON collectibles_carddetails (language);
            CREATE INDEX IF NOT EXISTS carddetails_market_btree_idx
                ON collectibles_carddetails (market_region);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS carddetails_language_btree_idx;
            DROP INDEX IF EXISTS carddetails_market_btree_idx;
            """,
        ),
    ]

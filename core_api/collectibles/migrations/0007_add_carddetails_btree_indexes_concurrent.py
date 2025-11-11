from django.db import migrations


class Migration(migrations.Migration):
    # Concurrent index creation cannot run inside a transaction
    atomic = False

    dependencies = [
        ("collectibles", "0006_add_carddetails_externalids_gin"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS carddetails_language_btree_idx
                ON collectibles_carddetails (language);
            CREATE INDEX CONCURRENTLY IF NOT EXISTS carddetails_market_btree_idx
                ON collectibles_carddetails (market_region);
            """,
            reverse_sql="""
            DROP INDEX CONCURRENTLY IF EXISTS carddetails_language_btree_idx;
            DROP INDEX CONCURRENTLY IF EXISTS carddetails_market_btree_idx;
            """,
        ),
    ]

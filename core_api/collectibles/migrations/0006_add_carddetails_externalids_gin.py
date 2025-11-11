from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("collectibles", "0003_vendor_carddetails_userprofile_collectible_vendor"),
    ]

    operations = [
        # Use raw SQL to create the pg_trgm extension (if available) and
        # create a GIN index on the text `external_ids` column using the
        # trigram operator class. Plain GIN on text requires an operator class
        # (provided by pg_trgm) which may not exist in minimal Postgres
        # images; the explicit SQL both creates the extension (if permitted)
        # and creates the index with the proper operator class. This keeps
        # the migration deterministic in dev/test environments.
        migrations.RunSQL(
            sql="""
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            CREATE INDEX IF NOT EXISTS carddetails_external_gin
                ON collectibles_carddetails USING gin (external_ids gin_trgm_ops);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS carddetails_external_gin;
            -- leave pg_trgm extension in place (shared across db)
            """,
        ),
    ]

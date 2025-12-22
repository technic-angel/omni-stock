from django.db import migrations
from django.conf import settings


def _uses_postgres():
    try:
        engine = settings.DATABASES.get('default', {}).get('ENGINE', '')
        return 'postgres' in engine or 'postgis' in engine
    except Exception:
        return False


class Migration(migrations.Migration):
    dependencies = [
        ("collectibles", "0003_vendor_carddetails_userprofile_collectible_vendor"),
    ]

    # Only run Postgres-specific SQL when the database engine is Postgres.
    if _uses_postgres():
        operations = [
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
    else:
        operations = []

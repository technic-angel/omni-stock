# CI, Secrets, and Migrations — Quick Operational Guide

This short guide documents required DB-side steps, migration safety notes, and CI considerations for the Omni-Stock backend. It is a draft intended for operations and reviewers; please review and sign-off before running any commands in staging or production.

## Purpose
- Record one-time database extension requirements (e.g., `pg_trgm`).
- Describe how to create large indexes safely in production (CONCURRENTLY).
- Provide a short staging/production checklist and rollback instructions.

## pg_trgm extension (trigram support)
Why: `pg_trgm` provides the `gin_trgm_ops` operator class used for trigram-based GIN indexes which speed up substring and similarity searches (e.g., `LIKE '%foo%'`).

Recommendation (safe, long-term):
- Ops-managed installation (recommended): have a DBA or platform engineer run the extension creation once per database before migrations that depend on it. This avoids granting extension-creation privileges to the app deployment user.

Command (ops to run in staging/production):

```sql
-- Run as a DBA or a role with CREATE privilege on extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Notes:
- `CREATE EXTENSION` is idempotent and safe to run multiple times.
- On many managed DB services (RDS, Cloud SQL), `pg_trgm` is available but the ability to install extensions can be restricted to admin roles.
- Document who ran this and when in your release notes.

## Creating GIN trigram indexes (production-safe)
For large tables, create trigram and other heavy indexes using `CONCURRENTLY` to avoid long locks.

Options:
- Preferred: Ops runs the index creation manually during a maintenance window:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS carddetails_external_gin
  ON collectibles_carddetails USING gin (external_ids gin_trgm_ops);
```

- Or, add a migration that runs this SQL with `atomic = False` (non-transactional). Mark this migration as production-only / require ops sign-off.

Dev/CI behaviour
- In dev and CI (test DBs) it is often preferable to create a simpler non-concurrent index so `manage.py migrate` can run inside a transaction. Keep the dev migration idempotent and guarded with `IF NOT EXISTS`.

## Staging checklist (recommended)
1. Ensure `pg_trgm` extension exists in staging: run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` as a DBA.
2. Deploy branch to staging and run migrations: `python manage.py migrate`.
3. Run smoke tests and E2E against staging (including searches that rely on trigram indexes).
4. If everything passes, schedule production index creation (CONCURRENTLY) during a low-traffic window.

## Production checklist (recommended)
1. Take a DB snapshot / backup before indexing if the table is large and you do not have fast fallbacks.
2. Ensure `pg_trgm` exists in production (ops step): `CREATE EXTENSION IF NOT EXISTS pg_trgm;`.
3. Create indexes using `CREATE INDEX CONCURRENTLY ...` or run a migration with `atomic = False` that executes this SQL. Monitor progress.
4. Run smoke/E2E tests against a read-only staging copy or after index creation, verify latencies, and watch for I/O impact.

## Rollback & recovery
- Dropping an index is usually safe and fast relative to creating it, but dropping should be coordinated: `DROP INDEX CONCURRENTLY IF EXISTS <index_name>;`.
- If the index build severely impacts production, consider canceling the index creation and/or working with your DBA to throttle or postpone.
- Always ensure a backup/snapshot exists before large schema operations.

## Permissions & responsibilities
- Recommended: ops/DBA runs `CREATE EXTENSION` and `CREATE INDEX CONCURRENTLY` in prod.
- If you prefer app-automated migrations to create extensions, confirm the migration runner has the necessary privileges and update this doc accordingly.

## Example commands (ops)

```bash
# Create pg_trgm extension (idempotent)
psql -d <DB_NAME> -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# Create GIN trigram index concurrently (ops)
psql -d <DB_NAME> -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS carddetails_external_gin ON collectibles_carddetails USING gin (external_ids gin_trgm_ops);"

# Drop index concurrently (ops rollback)
psql -d <DB_NAME> -c "DROP INDEX CONCURRENTLY IF EXISTS carddetails_external_gin;"
```

## PR notes template
When opening a PR that adds or relies on trigram indexes, include the following note in the PR description:

```
DBA notes: This PR requires the `pg_trgm` extension to exist in staging/production.
Please run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` before applying the migration that creates the GIN trigram index.
For production, create the index CONCURRENTLY (see docs/ci-secrets-and-migrations.md).
```

---
Drafted for review. Once you confirm the wording, I can commit it to the branch and/or open a PR referencing the migration changes.

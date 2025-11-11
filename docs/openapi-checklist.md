## OpenAPI checklist

This document describes the small checklist to keep the drf-spectacular OpenAPI baseline (`core_api/api_schema.json` and `api_schema.json`) in sync and how to handle intentional schema changes.

- When you change views/serializers/endpoints that affect the public API:
  1. Run the local development server or use Django's management command to generate the current schema:
     - From the repo root: `python core_api/manage.py spectacular --format openapi-json > core_api/api_schema.json`
     - (Optional) Also write the root baseline: `python core_api/manage.py spectacular --format openapi-json > api_schema.json`
  2. Run the OpenAPI snapshot test locally to see diffs:
     - `docker-compose exec core_api pytest core_api/collectibles/tests/test_openapi_schema.py -q`
  3. If the change is intentional, review the diff and commit the updated baseline files (`core_api/api_schema.json` and `api_schema.json`) with a commit message like: `docs(openapi): update baseline after intentional API change`.
  4. If the change is unintentional, revert or fix the view/serializer that caused it and re-run tests until the baseline matches.

- CI considerations
  - The repository includes a snapshot test that compares the generated schema to the committed baseline. Keep the baseline updated only in PRs that intentionally change the API.
  - For large API changes, include a short note in the PR describing the reason for the OpenAPI baseline update and list impacted paths.

- Automation tips
  - Use `drf-spectacular` version pinned in `core_api/requirements-dev.txt` to ensure stable schema generation across environments.
  - If you change docstrings or add explicit `@extend_schema` descriptions, expect the schema to change; update the baseline accordingly.

If you'd like, I can add a small helper script (`scripts/generate_openapi.sh`) that wraps the manage.py call and creates both baseline files—tell me if you want that.

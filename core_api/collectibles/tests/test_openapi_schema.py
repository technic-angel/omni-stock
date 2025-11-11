import json
import tempfile
from django.core.management import call_command
import pytest


@pytest.mark.django_db
def test_openapi_schema_matches_baseline():
    """Generate the OpenAPI schema and compare against committed baseline.

    This test guards against accidental API contract changes.
    """
    # generate schema to stdout and capture
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.json') as tmp:
        # request JSON output to match the committed baseline
        call_command('spectacular', '--format', 'openapi-json', stdout=tmp)
        tmp.flush()
        tmp.seek(0)
        generated = json.load(tmp)

    # Baseline may exist at core_api/api_schema.json or at repo root api_schema.json
    possible = ['core_api/api_schema.json', 'api_schema.json']
    for p in possible:
        try:
            with open(p, 'r', encoding='utf-8') as fh:
                baseline = json.load(fh)
            break
        except FileNotFoundError:
            baseline = None
    assert baseline is not None, f"Baseline schema not found at any of {possible}"

    assert generated == baseline

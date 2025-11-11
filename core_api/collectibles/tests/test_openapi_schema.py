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
        call_command('spectacular', stdout=tmp)
        tmp.flush()
        tmp.seek(0)
        generated = json.load(tmp)

    baseline_path = 'core_api/api_schema.json'
    with open(baseline_path, 'r', encoding='utf-8') as fh:
        baseline = json.load(fh)

    assert generated == baseline

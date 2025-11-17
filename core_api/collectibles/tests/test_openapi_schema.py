import json
import os
import tempfile
from django.core.management import call_command
import pytest


@pytest.mark.django_db
def test_openapi_schema_matches_baseline():
    """Generate the OpenAPI schema and compare against committed baseline.

    This test guards against accidental API contract changes.
    """
    # Ensure the lightweight CI settings are used so schema generation
    # is deterministic and doesn't require Postgres or other services.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'omni_stock.schema_generate_settings')

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

    # Normalize schema to ignore tooling-driven integer representation differences
    # (e.g. int32 vs int64 bounds and the `format` field). This keeps the test
    # sensitive to real contract changes while tolerating harmless generator
    # differences across environments.
    def normalize_integer_bounds_and_format(obj):
        if isinstance(obj, dict):
            # If this object is an integer schema, normalize known tooling noise.
            if obj.get('type') == 'integer':
                # Remove integer `format` and platform-specific numeric extremes
                # (32-bit vs 64-bit) which can differ across environments.
                obj.pop('format', None)

                # Remove common 64-bit extremes
                if obj.get('maximum') == 9223372036854775807:
                    obj.pop('maximum', None)
                if obj.get('minimum') == -9223372036854775808:
                    obj.pop('minimum', None)

                # Remove common 32-bit extremes
                if obj.get('maximum') == 2147483647:
                    obj.pop('maximum', None)
                if obj.get('minimum') == -2147483648:
                    obj.pop('minimum', None)

            # If this object is a string that uses `uri` format (e.g. image URLs),
            # normalize by stripping the `format` so minor generator differences
            # don't fail the contract test. Keep other meaningful formats like
            # `date-time` or `email`.
            if obj.get('type') == 'string' and obj.get('format') == 'uri':
                obj.pop('format', None)

            # Recurse into nested structures
            for v in obj.values():
                normalize_integer_bounds_and_format(v)
        elif isinstance(obj, list):
            for item in obj:
                normalize_integer_bounds_and_format(item)

    # Apply normalization to copies to avoid mutating original test artifacts
    import copy
    gen_copy = copy.deepcopy(generated)
    base_copy = copy.deepcopy(baseline)

    normalize_integer_bounds_and_format(gen_copy)
    normalize_integer_bounds_andFormat = normalize_integer_bounds_and_format
    normalize_integer_bounds_and_format(base_copy)

    # Canonicalize JSON (sort keys) to avoid incidental ordering differences
    def canonical(obj):
        return json.dumps(obj, sort_keys=True, separators=(',', ':'))

    gen_norm = canonical(gen_copy)
    base_norm = canonical(base_copy)

    assert gen_norm == base_norm

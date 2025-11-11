Testing the core_api
====================

This file explains how to run tests for the `core_api` Django backend used by the project.

Run tests inside the running development container (recommended):

```bash
docker-compose exec core_api pytest -q
```

Install test-only dependencies locally (optional):

```bash
pip install -r core_api/requirements-dev.txt
pytest -q
```

Files with tests live under `core_api/collectibles/tests/` and follow pytest conventions.

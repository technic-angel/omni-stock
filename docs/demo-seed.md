## Demo seed & local development data

The project includes a management command to create a demo vendor, demo user, and sample collectibles for local frontend and API development.

Usage

- From the repository root, run:

  python core_api/manage.py load_demo_data --count 5

- Options:
  - `--count N` — number of demo collectibles to create (default: 5)
  - `--overwrite` — if present and a Demo Vendor exists, existing demo collectibles will be removed and recreated.

Credentials

- The command creates (or reuses) a demo user with:
  - username: `demo_vendor`
  - password: `demo`

Testing

- A pytest test exists to validate the management command: `core_api/collectibles/tests/test_load_demo_data.py`.

Notes

- The command is safe for local use; it uses `get_or_create` for vendor/user and will not overwrite production data unless you run it against a production database.

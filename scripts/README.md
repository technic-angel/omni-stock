# OpenAPI Schema Management Scripts

This directory contains scripts for managing OpenAPI schema drift prevention.

## ⚠️ ROOT CAUSE: Why OpenAPI Keeps Failing

The OpenAPI schema **fails in CI** because of **environment-dependent schema generation**:

### Problem 1: Integer Bounds Vary by Environment
- **Python 3.10/3.11**: Generates different integer bounds for `IntegerField`
  - Some environments: `maximum: 2147483647` (32-bit int)
  - Other environments: `maximum: 9223372036854775807` (64-bit int)
- **Root cause**: drf-spectacular detects database capabilities differently

### Problem 2: Volatile Metadata
- `servers` array contains environment URLs (localhost vs CI)
- `info.version` includes timestamps/build numbers
- `x-*` fields vary between tool versions

### Problem 3: Key Ordering
- JSON serialization order can differ between Python versions
- Causes false positives in diff checks

## ✅ PERMANENT FIX (Implemented)

1. **Normalize integer fields** - Remove environment-dependent `maximum`/`minimum`/`format`
2. **Remove volatile metadata** - Strip `servers`, `info.version`, `x-*` fields
3. **Sort keys deterministically** - Always output in same order
4. **Use consistent settings** - Both local and CI use `schema_generate_settings`

## Scripts

### `normalize_openapi.py`

**Purpose:** Remove volatile fields from OpenAPI JSON and produce deterministic output.

**Usage:**
```bash
python3 scripts/normalize_openapi.py <generated.json> <target1.json> [<target2.json>...]
```

**What it does:**
- Removes top-level `servers` array
- Removes `info.version` and `info.description`
- Strips all `x-*` metadata fields (except `x-generated-by`)
- Outputs deterministically sorted JSON

**Example:**
```bash
# Normalize newly generated schema and update baseline files
python3 scripts/normalize_openapi.py \
    tmp/generated_schema.json \
    backend/api_schema.json \
    api_schema.json
```

---

### `update-openapi-schema.sh`

**Purpose:** Automated script to regenerate and normalize OpenAPI schema.

**Usage:**
```bash
./scripts/update-openapi-schema.sh
```

**What it does:**
1. Checks if backend container is running (starts if needed)
2. Generates OpenAPI schema using CI settings module (`schema_generate_settings`)
3. Normalizes the output
4. Updates both `backend/api_schema.json` and `api_schema.json`

**When to use:**
- After making changes to Django models, views, serializers, or URLs
- Before committing backend code changes
- When CI reports OpenAPI schema drift

**Example workflow:**
```bash
# Make backend changes
vim backend/catalog/models.py

# Regenerate schema
./scripts/update-openapi-schema.sh

# Review changes
git diff backend/api_schema.json

# Commit together
git add backend/catalog/models.py backend/api_schema.json api_schema.json
git commit -m "Add new field to Collectible model and update OpenAPI schema"
```

---

### `pre-commit-openapi.sh`

**Purpose:** Pre-commit hook to detect OpenAPI schema drift before pushing.

**Installation:**
```bash
# Option 1: Symlink (recommended)
ln -sf ../../scripts/pre-commit-openapi.sh .git/hooks/pre-commit

# Option 2: Copy
cp scripts/pre-commit-openapi.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it does:**
- Detects if backend Python files changed in commit
- Generates fresh OpenAPI schema in Docker container
- Compares with committed baseline
- **Blocks commit** if schema drift detected

**Behavior:**
- ✅ **Passes** if backend unchanged or schema matches
- ❌ **Fails** if schema drift detected (with instructions to fix)
- ⚠️  **Warns** if backend container not running (allows commit)

**Example output (drift detected):**
```
🔍 Backend code changed, checking OpenAPI schema...

❌ OpenAPI schema is out of sync with backend code!

   To fix, run:
   ./scripts/update-openapi-schema.sh

   Then stage the changes:
   git add backend/api_schema.json api_schema.json
```

---

## Developer Workflow

### Making Backend Changes

1. **Edit backend code** (models, views, serializers, URLs)
2. **Regenerate schema**:
   ```bash
   ./scripts/update-openapi-schema.sh
   ```
3. **Review changes**:
   ```bash
   git diff backend/api_schema.json
   ```
4. **Commit together**:
   ```bash
   git add backend/your_changes.py backend/api_schema.json api_schema.json
   git commit -m "Your change description"
   ```
5. **Push**:
   ```bash
   git push
   ```

### If CI Fails with Schema Drift

1. **Pull latest changes**:
   ```bash
   git pull origin your-branch
   ```
2. **Regenerate schema locally**:
   ```bash
   ./scripts/update-openapi-schema.sh
   ```
3. **Commit the fix**:
   ```bash
   git add backend/api_schema.json api_schema.json
   git commit -m "Fix OpenAPI schema drift"
   git push
   ```

---

## CI Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes an `openapi-check` job:

1. **Generates schema** using `schema_generate_settings` (CI-compatible, no PostgreSQL required)
2. **Normalizes output** using `normalize_openapi.py`
3. **Compares** with committed `backend/api_schema.json`
4. **Fails PR** if drift detected

**Why this works:**
- Uses **same Django settings** as local generation (`schema_generate_settings`)
- Applies **same normalization** before comparison
- Ensures **deterministic output** (no volatile fields)

---

## Troubleshooting

### "normalize_openapi.py not found" in CI

**Problem:** Script not committed to repository.

**Fix:**
```bash
git add scripts/normalize_openapi.py
git commit -m "Add OpenAPI normalization script"
git push
```

---

### Schema keeps drifting despite regeneration

**Possible causes:**
1. **Different Django settings** between local and CI
   - **Solution:** Both should use `backend.omni_stock.schema_generate_settings`

2. **Non-deterministic schema generation** (field ordering changes)
   - **Solution:** `normalize_openapi.py` sorts output deterministically

3. **Volatile metadata** (timestamps, server URLs)
   - **Solution:** `normalize_openapi.py` removes these fields

4. **Local environment differences** (database state, installed packages)
   - **Solution:** Generate schema in Docker container (same environment as CI)

---

### Pre-commit hook not running

**Check installation:**
```bash
ls -la .git/hooks/pre-commit
```

**Expected output:**
```
lrwxr-xr-x  1 user  staff  35 Nov 24 10:00 .git/hooks/pre-commit -> ../../scripts/pre-commit-openapi.sh
```

**Reinstall if missing:**
```bash
ln -sf ../../scripts/pre-commit-openapi.sh .git/hooks/pre-commit
```

---

### Backend container not running

**Start backend:**
```bash
docker-compose up -d backend
```

**Wait for readiness:**
```bash
docker-compose logs -f backend
# Wait for "Listening at: http://0.0.0.0:8000"
```

**Then regenerate schema:**
```bash
./scripts/update-openapi-schema.sh
```

---

## Technical Details

### Why Use `schema_generate_settings`?

The `backend.omni_stock.schema_generate_settings` module is a lightweight Django settings override that:

- Uses SQLite instead of PostgreSQL (CI doesn't have PostgreSQL)
- Disables authentication checks
- Generates schema without database queries

This ensures **identical schema generation** between local Docker and CI environments.

### Normalization Rules

`normalize_openapi.py` removes:

| Field | Reason |
|-------|--------|
| `servers` | Environment-specific URLs (localhost vs CI) |
| `info.version` | Git hash, build number, timestamps |
| `info.description` | May include dynamic content |
| `x-*` metadata | Tool-specific annotations (except `x-generated-by`) |

**Result:** Deterministic, environment-agnostic OpenAPI schema.

---

## Best Practices

1. ✅ **Always regenerate schema** after backend changes
2. ✅ **Commit schema with code** in the same commit
3. ✅ **Install pre-commit hook** to catch drift early
4. ✅ **Use update script** instead of manual commands
5. ✅ **Review schema diffs** before committing (catch unintended changes)
6. ❌ **Never edit `api_schema.json` manually** (always regenerate)
7. ❌ **Don't commit schema changes alone** (include code that caused them)

---

## Future Improvements

- [ ] Automatically install pre-commit hook during development setup
- [ ] Add `make` target: `make update-openapi`
- [ ] Create GitHub Action comment with schema diff when drift detected
- [ ] Add schema versioning (track breaking changes)
- [ ] Generate SDK from schema (TypeScript, Python clients)

---

## Questions?

See main project documentation or ask in team chat.

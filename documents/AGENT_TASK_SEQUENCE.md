# Omni-Stock — File Structure Rules (v1.0)

These rules define the **strict file and folder layout** required for Omni-Stock.  
All GitHub Copilot Agents MUST follow them exactly.  
Any deviation MUST be approved by the human.

---

# 🧱 BACKEND FILE STRUCTURE (MANDATORY)

The backend MUST follow a **Domain-Driven Modular Architecture**.

```
backend/
  users/
    models.py
    api/
      serializers.py
      viewsets.py
    services/
      create_user.py
      update_user.py
    selectors/
      get_user.py
      list_users.py
    tests/
  vendors/
    models.py
    api/
      serializers.py
      viewsets.py
    services/
      create_vendor.py
      update_vendor.py
    selectors/
      get_vendor.py
      list_vendors.py
    tests/
  inventory/
    models.py
    api/
      serializers.py
      viewsets.py
    services/
      create_item.py
      update_item.py
      delete_item.py
    selectors/
      get_item.py
      list_items.py
    tests/
  core/
    permissions.py
    exceptions.py
    utils.py
    validators.py
```

### Backend Rules:

1. **ALL business logic MUST live in services (write) or selectors (read).**
2. Views MUST contain zero logic.
3. Serializers MUST contain zero logic.
4. Models MUST remain declarative and clean.
5. Each service file MUST handle one use case only.
6. Each selector file MUST handle one query only.
7. “God files” (files >200 lines) are forbidden.
8. No deeply nested folders beyond the domain-level allowed hierarchy.
9. No duplicate code between domains.

---

# ⚛️ FRONTEND FILE STRUCTURE (MANDATORY)

The frontend MUST follow a **Feature-Driven Architecture**.

```
src/
  features/
    auth/
      api/
      components/
      hooks/
      pages/
    vendors/
      api/
      components/
      hooks/
      pages/
    inventory/
      api/
      components/
      hooks/
      pages/
    dashboard/
      api/
      components/
      hooks/
      pages/
  shared/
    components/
    hooks/
    lib/
    types/
```

### Frontend Rules:

1. No file may exceed 200–250 lines without approval.
2. All network logic MUST live in `api/` inside each feature.
3. All business logic MUST live in hooks (`useXyz`) NOT components.
4. All form schemas MUST use Zod and live next to the form components.
5. Shared components MUST be reusable and generic — no feature-specific logic.
6. Pages MUST remain simple and delegate work to components and hooks.
7. No React Query usage inside components — hooks only.

---

# 🗂️ NAMING RULES

### Backend:
- Services: `create_x.py`, `update_x.py`, `delete_x.py`
- Selectors: `get_x.py`, `list_x.py`
- Tests: `test_<name>.py`
- API viewsets: `<ModelName>ViewSet`
- Serializers: `<ModelName>Serializer`

### Frontend:
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.ts`
- API files: `camelCase.ts`
- Zod schemas: `schema.ts`

### Files that MUST NOT exist:
- `utils.js` (feature-specific)
- `helpers.py` (catch-all)
- `misc/`
- `old/`
- `temp/`
- Any file ending in `_copy` or `_backup`

---

# 🧹 CLEANLINESS RULES

To maintain a professional-grade code structure, the agent MUST:

### Required:
- Keep folder trees shallow  
- Keep files short (under 200–250 lines)  
- Delete unused code  
- Delete unused imports  
- Avoid duplication  

### Forbidden:
- Dumping logic into root folders  
- Creating catch-all util files  
- Leaving commented-out code  
- Leaving TODOs unless approved  
- Creating more than 3 nested folders  
- Putting multiple unrelated classes in the same file  

---

# 🧪 TEST ORGANIZATION RULES

All tests MUST live inside:

```
backend/<domain>/tests/
```

Test files MUST match the structure of the feature:

```
services/test_create_item.py
selectors/test_list_items.py
api/test_inventory_api.py
```

Tests MUST be grouped by responsibility.  
Tests MUST NOT be placed in root or mixed across domains.

---

# 🔥 AGENT RESPONSIBILITY RULES

The agent MUST:

1. Enforce the folder + file structure on every change.
2. Check whether new files follow this structure before creation.
3. Reject or request clarification for incorrect file placements.
4. Ask the human when unsure.

---

# 🛑 FAIL-SAFE RULE

If ANY file placement conflicts with the rulebook:

> **STOP immediately and request human clarification.**

---

# END OF FILE STRUCTURE RULES (v1.0)

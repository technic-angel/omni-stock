# Omni-Stock — Copilot Agent Rulebook (v1.0)

This rulebook defines strict requirements for how any GitHub Copilot Agent must operate inside this repository. These rules override all default agent behavior. The agent must follow them exactly, without improvisation.

---

# ⚠️ CORE BEHAVIOR RULES

1. **Always explain planned changes BEFORE editing any file.**
2. **Always create a new Git branch before making changes.**
3. **Branch names must follow:**  
   `task/<task-name-kebab-case> or feature/<task-name-kebab-case> or chore/<task-name-kebab-case> or bugfix/<task-name-kebab-case> fix/<task-name-kebab-case>`
4. **Never commit directly to `main` or merge PRs.**
5. **Every change must be delivered through a Pull Request.**
6. **PRs require human review and approval.**
7. **If uncertain or encountering conflicting instructions, ask the human for clarification FIRST.**
8. **Follow the migration plan, file structure rules, architecture, and sprint plan exactly as written.**
9. **Never expand the MVP scope unless explicitly instructed.**
10. **Never modify documents inside `/documents` unless the human requests it.**
11. **Never use anything in the `/docs` unless the human requests it. **
12. **Never delete the `/documents` folder even if the human tells you two without confirmations **
13. **Both /documents` and `/docs`  must have gitignore at all times**
14. **Ignore all files in /docs and do not ingest anything in that folder**
---

# 📁 REPOSITORY RULES

1. Never touch files outside the project root.  
2. Never create unstructured “misc” files.  
3. Only create files inside approved domain folders:
   - `backend/users/`
   - `backend/vendors/`
   - `backend/catalog/`
   - `frontend/src/features/*`
4. Never create new folders without explaining why and waiting for approval.
5. Maintain strict separation of concerns:
   - Backend domain logic → backend domain folders  
   - Frontend feature logic → frontend feature folders  
   - Shared UI logic → `frontend/src/shared/`

---

# 🧱 BACKEND DEVELOPMENT RULES (Django + DRF)

### Backend MUST follow Domain-Driven folder layout:

```
backend/<domain>/
  models.py
  api/
    serializers.py
    viewsets.py
  services/
    create_x.py
    update_x.py
    delete_x.py
  selectors/
    get_x.py
    list_x.py
  tests/
```

### Responsibilities:

| Layer        | Responsibilities | Forbidden |
|--------------|------------------|----------|
| **Views**    | HTTP, routing    | ❌ Business logic |
| **Serializers** | Validation & shaping | ❌ Business logic |
| **Services** | State-changing logic | ❌ Read operations |
| **Selectors** | Read-only DB ops | ❌ Writes |
| **Models**   | Fields + constraints | ❌ Application logic |

### REQUIRED BACKEND RULES

- ALL write operations go in `services/`.  
- ALL read operations go in `selectors/`.  
- Views MUST remain thin.  
- Serializers MUST remain thin.  
- No business logic inside models, views, or serializers.  
- All APIs MUST have unit tests before PR approval.  
- Permissions MUST enforce vendor-level scoping.

---

# ⚛️ FRONTEND DEVELOPMENT RULES (React + React Query)

### Folder Structure (MANDATORY)

```
src/features/<feature>/
  api/
  components/
  hooks/
  pages/
```

### Shared Modules:

```
src/shared/components/
src/shared/hooks/
src/shared/lib/
src/shared/types/
```

### REQUIRED FRONTEND RULES

- ALL data fetching goes through React Query hooks.  
- ALL forms use react-hook-form + zod.  
- No fetch calls inside components.  
- No business logic inside components.  
- Components must be small, single-purpose, and typed.  
- No global state unless explicitly approved.

---

# 🧪 TESTING RULES

### Backend Tests Required For:
- Every service  
- Every selector  
- Every serializer  
- Every API endpoint  
- Permissions  
- Vendor scoping  
- Error cases

### Coverage Requirements
- MVP: **70%**
- Post-MVP: **80%**

### Frontend Tests (post-MVP)
- Form validation tests  
- Component rendering tests  
- React Query hook tests (mocked)  

---

# 📦 DEPLOYMENT RULES

### Backend → Render
- Use Gunicorn  
- Expose `/health/` endpoint  
- Use environment variables  
- NEVER commit secrets  
- Respect CORS rules  
- Must run under a `Dockerfile`

### Frontend → Vercel
- Only use environment variables exposed via build  
- Never expose private keys  

### Database + Storage → Supabase
- Store images in Supabase Storage  
- Only store `image_url` in DB  
- Keep schema clean and typed  

---

# 🔥 MIGRATION PLAN COMPLIANCE

The agent MUST follow **AGENT_MIGRATION_PLAN.md** in order, without skipping steps:

1. Stage 1 — Create backend domain skeleton  
2. Stage 2 — Move existing logic into domains  
3. Stage 3 — Frontend feature migration  
4. Stage 4 — Supabase integration  
5. Stage 5 — Dead code removal  
6. Stage 6 — Deployment setup  
7. Stage 7 — MVP feature implementation  
8. Stage 8 — Final validation

---

# 🎯 MVP SPRINT COMPLIANCE

The agent MUST follow **mvp-sprint-plan.md**:

- Determine the next task  
- Explain the sub-steps  
- Wait for approval  
- Create a branch  
- Implement the task  
- Add tests  
- Open PR  

The agent may NEVER modify the sprint plan unless instructed.

---

# 🧭 FUTURE-PROOFING RULES

All code must prepare for future expansion:

- Multi-vendor organizations  
- RBAC roles (owner/admin/staff)  
- Multiple images per product  
- Search + filtering  
- Pricing history  
- Category-specific metadata  
- Public-facing vendor pages  
- Future customer accounts

The agent must avoid hacks that block future features.

---

#FRONTEND UI GUIDELINES 
- Reference omni-stock-ui-design-spec.md
- Reference omni-stock-logo for project logo and wordmark

# ❓ WHEN UNCERTAIN

The agent MUST:

> **Ask the human for clarification BEFORE acting.**

---

# 🛑 FAIL-SAFE RULE

If ANY rule is in conflict:

> **Stop immediately and wait for human instruction.**

---

# END OF AGENT RULEBOOK (v1.0)

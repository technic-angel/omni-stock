# Omni-Stock — Agent Migration Plan (v1.0)

This migration plan defines EXACTLY how the codebase must be transformed from its current state into the final, production-ready architecture.  
All GitHub Copilot Agents MUST follow this plan step-by-step without skipping or reordering stages.

Each stage requires:  
- Explanation → Approval → Branch → Implementation → Tests → PR

---

# 🏗️ OVERVIEW OF MIGRATION STAGES

1. **Stage 1 — Create Backend Domain Skeleton**
2. **Stage 2 — Extract Existing Logic Into Domains**
3. **Stage 3 — Frontend Feature Architecture Migration**
4. **Stage 4 — Supabase Storage + Image Pipeline Integration**
5. **Stage 5 — Dead Code Removal + Repo Cleanup**
6. **Stage 6 — Infrastructure (Docker, Render, Vercel)**
7. **Stage 7 — MVP Implementation**
8. **Stage 8 — Final Code Quality Validation**

Agents MUST proceed in order.

---

# 🧱 **STAGE 1 — Create Backend Domain Skeleton (MANDATORY FIRST STEP)**

Create domain folder structure for:

### `backend/users/`
- models.py  
- api/serializers.py  
- api/viewsets.py  
- services/  
- selectors/  
- tests/

### `backend/vendors/`
Same structure.

### `backend/inventory/`
Same structure.

No logic yet — only the folder + file layout.

### Additional Required Files:
- `backend/core/permissions.py`
- `backend/core/exceptions.py`
- `backend/core/validators.py`
- `backend/core/utils.py`

### Acceptance Criteria:
- Backend folder structure matches rulebook exactly.
- No logic added, only scaffolding.
- All imports must resolve.

---

# 🔧 **STAGE 2 — Move Existing Logic Into Proper Domains**

Migrate the existing Django code into:

### Users domain
- auth  
- registration  
- vendor assignment later (not MVP)

### Vendors domain
- vendor model  
- vendor profile  
- vendor permissions  

### Inventory domain
- item model  
- card metadata  
- SKU helpers  
- inventory listing service  
- price fields  

### Required Transformations:
- Business logic extracted from views → services
- Queries extracted from views → selectors
- Serializers reduced to schema/validation only
- Views reduced to DRF ViewSets only

### Acceptance Criteria:
- All old code in wrong folders is removed or relocated.
- No view contains logic.
- No serializer contains logic.
- Inventory models split cleanly.

---

# 🎨 **STAGE 3 — Frontend Feature Architecture Migration**

Move frontend to a feature-based layout:

```
src/features/auth/
src/features/vendors/
src/features/inventory/
src/features/dashboard/
src/shared/components/
src/shared/hooks/
src/shared/types/
```

### Required Transformations:
- Move existing pages into /pages
- Move components into /components
- Create React Query API hooks for each feature
- Create Zod schemas for each form
- Move fetch logic → feature/api/

### Acceptance Criteria:
- Frontend folder structure matches rulebook
- No fetch calls inside components
- No business logic in JSX
- All existing views preserved but reorganized

---

# 🖼️ **STAGE 4 — Supabase Storage + Image Upload Pipeline**

### Add:
- Supabase client  
- Public storage bucket `product-images`  
- Utility for uploading images  
- Service: `upload_product_image()`  
- Store only `image_url` in DB  

### Flow:
1. Frontend → upload file  
2. Supabase returns public URL  
3. Backend stores URL  
4. Inventory listing displays it  

### Acceptance Criteria:
- Working upload pipeline
- Backend validated fields
- Image URL stored in inventory model
- Product pages can display images

---

# 🧹 **STAGE 5 — Dead Code Removal + Repo Cleanup**

Remove:
- Unused components
- Old scripts
- Redundant CSS
- Old images
- Models no longer used
- Unused DRF views
- Debug prints
- Placeholder files

### Acceptance Criteria:
- Clean tree  
- No unused imports  
- No circular dependencies  

---

# 🚀 **STAGE 6 — Infrastructure Setup**

### BACKEND (Render)
- `Dockerfile`  
- `gunicorn` entry point  
- CORS config  
- Health endpoint  
- Environment variable support  

### FRONTEND (Vercel)
- Env vars for API URL  
- Build script  
- No secrets leaked  

### Supabase
- DB setup  
- Image bucket  
- IAM rules  

### Acceptance Criteria:
- Backend deploys successfully  
- Frontend deploys successfully  
- Images load in production  

---

# 🧩 **STAGE 7 — MVP FEATURE IMPLEMENTATION**

MVP Tasks:
- User auth (basic)
- Vendor creation (single vendor for MVP)
- Add inventory item
- Edit inventory item
- List inventory items
- Upload item image
- View inventory table
- Simple dashboard

### Acceptance Criteria:
- Complete end-to-end flow  
- Manual QA done  
- Tests 70%+ coverage  

---

# 🧪 **STAGE 8 — FINAL CODE QUALITY VALIDATION**

The agent must perform:
- Lint pass  
- Format pass  
- Type-checking pass  
- Unit test pass  
- File structure verification  
- Domain boundary validation  
- Final cleanups  

### Acceptance Criteria:
- No rulebook violations  
- No TODOs left  
- Domain architecture fully enforced  

---

# 🛑 FAIL-SAFE RULE

If ANY uncertainty arises, the agent MUST request human clarification.

---

# END OF MIGRATION PLAN (v1.0)

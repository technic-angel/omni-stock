# Omni-Stock — System Architecture Overview (v1.0)

This document describes the complete system architecture for Omni-Stock, covering backend, frontend, data flows, storage, and integration patterns.  
It defines how all technical components interact and serves as the foundation for all future development.

---

# 🧩 HIGH-LEVEL SYSTEM OVERVIEW

Omni-Stock is a multi-vendor inventory management system targeted at:

- card shops  
- video game vendors  
- collectible sellers  
- pawn shops  
- con/event vendors  

The system supports vendor-managed inventory, multi-image product uploads, and eventually a customer-facing marketplace.

The architecture is split into 3 layers:

1. **Backend (Django + DRF)**
2. **Frontend (React + Vite + React Query)**
3. **Cloud Services (Supabase + Render + Vercel)**

---

# ⚙️ BACKEND OVERVIEW (Django + DRF)

The backend exposes a REST API to support:

- User Authentication  
- Vendor Accounts (MVP: single vendor)  
- Inventory Management  
- Product Images (Supabase Storage)  
- Category Metadata  
- Service / Selector Architecture  
- Domain-Driven Folder Structure  

### Key principles:

- Backend is **stateless**  
- **Domain-driven** modular architecture  
- All business logic lives in **services**  
- All read operations live in **selectors**  
- Views expose minimal DRF ViewSets  

### Domains:

```
users/
vendors/
inventory/
core/
```

Each domain is an isolated functional unit with its own:

- models  
- services  
- selectors  
- serializers  
- viewsets  
- tests  

---

# 📦 FRONTEND OVERVIEW (React + React Query + Vite)

The frontend is a **feature-first** architecture.

Features:

```
auth/
inventory/
vendors/
dashboard/
```

Shared modules:

```
shared/components/
shared/hooks/
shared/types/
shared/lib/
```

### Key principles:

- ALL data fetching uses **React Query**  
- ALL forms use **React Hook Form + Zod**  
- Pages contain no business logic  
- Components remain small and pure  
- Hooks encapsulate all functional logic  

---

# 🗄️ DATABASE (Supabase Postgres)

### Tables (MVP):

#### `users`
- id  
- email  
- password hash  
- role (future: owner/admin/staff)  

#### `vendors`
- id  
- name  
- description (future)  
- logo_url (future)  

#### `inventory_items`
- id  
- vendor_id (FK → vendors)  
- name  
- description  
- condition  
- category  
- price  
- quantity  
- image_url  
- created_at  
- updated_at  

#### Future Expansion:
- category-specific metadata  
- price history  
- multiple images  
- marketplace listings  

---

# 🖼️ IMAGE STORAGE (Supabase Storage)

### Bucket:
```
product-images
```

### Flow:
1. Frontend → upload file  
2. Supabase returns `publicUrl`  
3. Backend stores the URL in the inventory model  
4. Frontend displays using the URL  

Images should **never** be stored in the repository.

---

# 🔌 API DESIGN

The API is completely REST-based:

Example routes:

```
POST /auth/login
POST /auth/register

GET /vendors/me
PATCH /vendors/me

GET /inventory/
POST /inventory/
PATCH /inventory/:id
DELETE /inventory/:id
```

---

# 🔐 AUTHENTICATION & AUTHORIZATION

Auth method:

- DRF token auth (MVP)
- JWT (post-MVP optional)

Permissions:

- Vendor-owned inventory only  
- A vendor cannot see another vendor's items  

Future RBAC:

- Owner  
- Admin  
- Staff  

---

# 📤 DATA FLOW (END TO END)

### 1. Auth Flow
User logs in → Token stored → Token passed to React Query for authenticated requests.

### 2. Inventory Creation
Frontend form → Validation via Zod → React Query mutation → Backend service creates item → Selector returns updated data → UI refreshes.

### 3. Image Upload
User selects image → Upload to Supabase → URL returned → Sent to backend → Saved in DB → Displayed on dashboard.

### 4. Fetch Inventory List
React Query fetch → Backend selector → Return JSON list → Displayed in UI table.

---

# 🚀 DEPLOYMENT ARCHITECTURE

### Backend → Render
- Runs inside Docker  
- Exposes `/health/`  
- Gunicorn  
- Environment variables for DB + Supabase  

### Frontend → Vercel
- Built with Vite  
- Consumes backend via API URL  
- Uses public env variables only  

### Database → Supabase
- Managed Postgres  
- Storage for images  
- Row-level security (future)  

---

# 🛠️ DEVELOPMENT WORKFLOW

1. Agent proposes change  
2. Create branch  
3. Write services + selectors  
4. Write tests  
5. PR review  
6. Merge  
7. Build & deploy  

---

# 🔮 FUTURE ARCHITECTURE EXPANSIONS

- Multi-vendor organizations  
- Multi-image gallery  
- Pricing history  
- Category-specific fields (cards vs games vs collectibles)  
- Search + filtering  
- Marketplace version  
- Customer accounts  
- Vendor storefront pages  
- Analytics dashboard  

---

# END OF SYSTEM ARCHITECTURE (v1.0)

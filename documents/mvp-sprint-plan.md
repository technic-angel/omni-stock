# Omni-Stock — MVP Sprint Plan (v1.0)

This document defines the **strict 1–2 week MVP sprint** used by the GitHub Copilot Agent and by you as the human operator.  
The agent MUST follow this sprint plan chronologically, without skipping or reordering tasks.

This MVP includes:

- Complete backend domain architecture  
- Complete frontend feature architecture  
- Inventory CRUD  
- Supabase image upload pipeline  
- Basic vendor structure (single vendor MVP)  
- Authentication  
- Clean UI  
- Render + Vercel deployment  

---

# 🏁 SPRINT 0 — PREP WORK (Already Done)

You have already:

- Defined architecture  
- Defined rulebook  
- Defined migration plan  
- Defined file structure  
- Created the documents/ folder  
- Prepared agent initialization commands  

This sprint begins AFTER the agent loads `/documents`.

---

# 🚀 **SPRINT 1 — Backend Infrastructure Setup (Day 1–2)**

### 🎯 Goals:
- Establish backend domain architecture  
- Create Django domain folder structure  
- Prepare models  
- Prepare services/selectors  

### Tasks:

#### **1.1 — Create domain folders**
- backend/users
- backend/vendors
- backend/inventory
- backend/core

#### **1.2 — Create empty API/Services/Selectors/Tests files**
For each domain.

#### **1.3 — Implement user model**
- email  
- password hash  
- simple token auth  

#### **1.4 — Implement vendor model (MVP: one vendor per user)**  
Fields:  
- name  
- created_at  
- updated_at  

#### **1.5 — Implement inventory item model**
Fields:  
- vendor (FK)  
- name  
- description  
- condition  
- category  
- price  
- quantity  
- image_url  
- timestamps  

#### **1.6 — Create basic services and selectors**
- create_item  
- update_item  
- delete_item  
- list_items  
- get_item  

#### **1.7 — Basic authentication endpoints**

### ✔ Deliverables:
- Running backend  
- Clean API folder structure  
- Model + service + selector architecture  

---

# 🔧 **SPRINT 2 — Backend API Implementation (Day 2–3)**

### 🎯 Goals:
- Full CRUD for inventory  
- Permissions  
- Serializer validation  
- Vendor scoping  

### Tasks:

#### **2.1 — Inventory serializers**
- input + output objects  
- simple validation  

#### **2.2 — Inventory views / viewsets**
Use DRF ModelViewSet pattern.

#### **2.3 — Vendor scoping permission class**
Ensure only vendor's own items can be accessed.

#### **2.4 — API endpoints**
- POST /inventory  
- GET /inventory  
- GET /inventory/:id  
- PATCH /inventory/:id  
- DELETE /inventory/:id  

#### **2.5 — Tests**
- service tests  
- selector tests  
- API tests  
- permission tests  

### ✔ Deliverables:
- Fully functional backend CRUD  
- Permission-secure vendor scoping  
- Tests at 70% coverage  
- Ready for frontend consumption  

---

# 🖼️ **SPRINT 3 — Supabase Image Upload Pipeline (Day 3–4)**

### 🎯 Goals:
- Upload image → get URL → backend saves URL  

### Tasks:

#### **3.1 — Add Supabase SDK to backend**
For verifying URLs only.  
Upload happens on frontend.

#### **3.2 — Frontend Supabase upload utility**
- upload file  
- get public URL  

#### **3.3 — Backend: accept `image_url` field**  
- validate string  
- ensure vendor owns item  

### ✔ Deliverables:
- Working image upload pipeline  
- Items can store and display images  

---

# 🎨 **SPRINT 4 — Frontend Architecture Setup (Day 4–5)**

### 🎯 Goals:
- Build feature-based architecture  

### Tasks:

#### **4.1 — Create feature folders**
- auth/  
- inventory/  
- vendors/  
- dashboard/  

#### **4.2 — Build React Query client wrapper**
#### **4.3 — Build shared layout**
#### **4.4 — Build shared components**
- Table  
- Card  
- Loader  
- Form wrapper  

### ✔ Deliverables:
- Fully structured frontend  
- Ready for feature build-out  

---

# 🧱 **SPRINT 5 — Frontend MVP Features (Day 5–7)**

### 🎯 Goals:
- Inventory CRUD UI  
- Auth UI  
- Vendor profile basics  

### Tasks:

#### **5.1 — Login page**
- form + validation  
- API call  
- store token  

#### **5.2 — Inventory list page**
- table view  
- React Query list call  

#### **5.3 — Add item page**
- form + Zod schema  
- image upload + preview  
- create item API hook  

#### **5.4 — Edit item page**
- load item  
- edit form  
- update API hook  

#### **5.5 — Delete item**
- confirmation modal  

#### **5.6 — Vendor profile**
- simple view of vendor info  

### ✔ Deliverables:
- End-to-end UI  
- Clean forms  
- Image upload working  
- Table listing  

---

# 🚀 **SPRINT 6 — Deployment (Day 7–8)**

### 🎯 Goals:
- Backend on Render  
- Frontend on Vercel  
- Image pipeline works in prod  

### Tasks:

#### **6.1 — Backend Dockerfile**
Render-compatible.

#### **6.2 — CORS & environment config**
#### **6.3 — Deploy backend**
#### **6.4 — Deploy frontend**
#### **6.5 — Connect frontend → backend**

### ✔ Deliverables:
- Live URL  
- Fully working MVP  
- Can be demonstrated to employers  

---

# 🎉 END OF MVP SPRINT PLAN (v1.0)

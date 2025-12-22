# PASTE FULL CONTENT HERE
# Omni-Stock — Backend Architecture (v1.0)

This document defines the official backend architecture for Omni-Stock.  
All GitHub Copilot Agents MUST follow this structure when creating or modifying backend code.  
Deviations require explicit human approval.

The backend uses:

- **Django 4+**
- **Django REST Framework (DRF)**
- **Domain-Driven Modular Architecture**
- **Service / Selector pattern**
- **PostgreSQL (Supabase)**

---

# 🧱 HIGH-LEVEL GOALS

The backend must:

1. Be modular and domain-driven  
2. Enforce strict separation of concerns  
3. Avoid “fat views”, “fat serializers”, and “fat models”  
4. Centralize all business logic in the correct layers  
5. Support multi-vendor inventory scaling  
6. Be easy to test  
7. Support both MVP and long-term growth  

---

# 🗂️ BACKEND FOLDER STRUCTURE (MANDATORY)

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

---

# 🔍 DOMAIN RESPONSIBILITIES

## **1. users domain**
Handles:

- Authentication  
- Registration  
- Vendor membership (future)  
- Role-based access control (future)  

## **2. vendors domain**
Handles:

- Vendor profiles  
- Vendor settings  
- Ownership relations  
- Vendor permissions  

## **3. inventory domain**
Handles:

- Inventory items  
- Product details  
- Images  
- Conditions  
- Categories  
- Pricing  
- Quantity  
- Read optimizations  

## **4. core domain**
Contains framework-level utilities:

- Permissions  
- Custom exceptions  
- Validators  
- Shared mixins  

---

# ⚙️ BUSINESS LOGIC LAYER (SERVICES)

**All write operations MUST be implemented as services.**

Examples:

```
backend/catalog/services/create_item.py
backend/catalog/services/update_item.py
backend/vendors/services/create_vendor.py
backend/users/services/create_user.py
```

### Services MUST:
- Perform data validation  
- Apply business rules  
- Create/update/delete data  
- Raise custom exceptions  
- Return models or dicts, not HTTP responses  

### Services MUST NOT:
- Query for data (selectors only)  
- Touch request/response objects  
- Perform permission logic  
- Contain debugging prints  

---

# 🔍 READ LOGIC LAYER (SELECTORS)

**All read operations MUST be implemented as selectors.**

Examples:

```
backend/catalog/selectors/get_item.py
backend/catalog/selectors/list_items.py
```

Selectors perform:

- QuerySet operations  
- Prefetch/select_related optimizations  
- Filtering + ordering  
- Pagination-ready queries  

Selectors MUST return:

- QuerySets  
- Dataclasses (optional)  
- Plain dict representations  
- Lists of objects  

Selectors MUST NOT:

- Create or update data  
- Perform business rules  
- Perform validation  
- Import serializers  

---

# 🧪 API LAYER (SERIALIZERS + VIEWSETS)

### ViewSet responsibilities:
- Routing  
- Permissions  
- Delegating to services/selectors  
- Returning responses  

### Serializer responsibilities:
- Shape input  
- Validate input fields  
- Shape output  
- Basic type checks  

### Serializers MUST NOT:
- Create or update objects directly  
- Perform business logic  
- Perform queries  

---

# 🧬 MODELS LAYER

Models define:

- Fields  
- DB constraints  
- Meta options  
- Relationships  
- Small helper properties  

Models MUST be thin and declarative.

Models MUST NOT contain:

- Business rules  
- External service calls  
- Cross-domain logic  
- Complex methods  

---

# 🔒 PERMISSIONS (MANDATORY)

Vendor scoping rules:

- A user may only access inventory items belonging to their vendor.  
- No vendor may view or modify another vendor’s data.  
- Admins may access everything (post-MVP).  

Permissions are implemented in `core/permissions.py`.

---

# 🧹 CLEANUP + CONSISTENCY RULES

Every backend change must ensure:

- No unused imports  
- No commented-out code  
- No dead functions  
- No duplicate logic  
- No global utilities except pure helpers  

---

# 🧪 TESTING REQUIREMENTS

Every service, selector, and API endpoint MUST have tests.

Tests MUST be placed in:

```
backend/<domain>/tests/
```

Test types:

- Happy path  
- Error path  
- Permission tests  
- Vendor scoping  
- Invalid input tests  

---

# 🚀 FUTURE BACKEND EXPANSION

This architecture prepares for:

- Multi-image product galleries  
- Search + filtering  
- Pricing history  
- Category-specific metadata (e.g., TCG cards vs video games)  
- Customers + marketplace  
- Vendor teams with multiple roles  
- Webhooks + integrations  

---

# END OF BACKEND ARCHITECTURE (v1.0)

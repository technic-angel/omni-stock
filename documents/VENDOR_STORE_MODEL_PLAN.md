# Vendor / Store Model Plan

Date: 2025-12-09

## Original Requirements

The following is the complete user request that drove this refactoring plan:

> I want to refactor the backend model and logic to the following. I want a user accounts to be independent. I want a user to be able link to a vendor and be able to add other users to the vendor. There should be Role like admin, manager, and sales roles. Admin controls who can be added to the vendor and be able to make a new table called a store and the store will hold products with different types of products.
>
> Each vendor and have a group of stores which which will hold say the inventory of a vendors pop up retail table, a card store and online store etc. The admin can assign who can look at the each store and allow sales, and managers to have various permissions to add, remove and adjust price of products in the store.
>
> I want to be able to have the vendor model to be able to track who is a member of the vendor, their role and be able to promote or change ownership of the store.
>
> I want each store to have its own inventory of products
>
> Next I want there to be there to be store and vendor media so we can upload a banner, avatar etc for each.
>
> Suggest other fields these tables can have as well.

---

## Summary

This document captures the suggested backend refactor for supporting vendor accounts, stores, roles, and per-store inventory/permissions.

---

## Architectural Overview

1. **User Independence**: Users are standalone entities. They are not hard-linked to a single vendor via their profile.
2. **Vendor Membership (RBAC)**: A `VendorMember` table links Users to Vendors. Users may belong to multiple vendors and have a Vendor-Level Role (Admin, Member).
3. **Stores**: A `Store` model represents physical or digital outlets owned by a `Vendor`.
4. **Store Permissions**: A `StoreAccess` model controls which employees can access which store and what actions they can perform (Manager vs Sales).
5. **Inventory**: The `Product` (Collectible) model is assigned to a `Store`, enabling distinct inventory per store.

## Mermaid ER Diagram

```mermaid
erDiagram
    User ||--o{ VendorMember : "joins"
    Vendor ||--o{ VendorMember : "has members"
    Vendor ||--o{ Store : "owns"
    Store ||--o{ Product : "stocks"
    VendorMember ||--o{ StoreAccess : "assigned to"
    Store ||--o{ StoreAccess : "has staff"

    User {
        int id
        string email
        string username
        string avatar_url
    }

    Vendor {
        int id
        string name
        string slug
        string logo_url
        string banner_url
        string tax_id
        boolean is_active
    }

    VendorMember {
        int id
        int user_id
        int vendor_id
        string role "ADMIN, MEMBER"
        boolean is_active
        datetime joined_at
    }

    Store {
        int id
        int vendor_id
        string name
        string type "RETAIL, POPUP, ONLINE"
        string address
        string logo_url
        string banner_url
        string currency
        boolean is_active
    }

    StoreAccess {
        int id
        int store_id
        int vendor_member_id
        string role "MANAGER, SALES"
        json permissions "custom overrides"
    }

    Product {
        int id
        int store_id
        string name
        string sku
        int quantity
        decimal price
    }
```

---

## Detailed Model Breakdown & Field Suggestions

### Vendor
Represents the top-level organization.

- Fields:
  - `name` (string)
  - `slug` (string)
  - `description` (text)
  - `logo_url` (URL) — brand/avatar
  - `banner_url` (URL)
  - `owner` (FK -> `User`) — optional primary owner
  - `tax_id` (string) — optional for invoicing
  - `subscription_plan` (string or FK) — Free/Pro/Enterprise
  - `is_active` (bool)
  - `contact_info` (JSON/text)
  - timestamps: `created_at`, `updated_at`

### VendorMember
Tracks membership and role within a Vendor.

- Fields:
  - `user` (FK -> `User`)
  - `vendor` (FK -> `Vendor`)
  - `role` (choices): `ADMIN`, `MEMBER` (can extend to `OWNER`/`BILLING` later)
  - `is_active` (bool)
  - `joined_at` (datetime)
  - `invite_code` or `joined_via` (optional metadata)

Behavior:
- `ADMIN` can invite/remove members, create stores, configure vendor settings.
- Consider an `OWNER` role for transfer-of-ownership flows.

### Store
Represents a specific sales/stock location.

- Fields:
  - `vendor` (FK -> `Vendor`)
  - `name` (string)
  - `type` (enum): `RETAIL`, `POPUP`, `ONLINE`, `WAREHOUSE`
  - `address` (text/structured) — optional
  - `logo_url`, `banner_url` (URL)
  - `currency` (string)
  - `default_tax_rate` (decimal)
  - `is_active` (bool)
  - `operating_hours` (JSON) — optional
  - `location_lat`, `location_long` (decimal) — optional
  - timestamps

Permissions & behavior:
- Stores are scoped to a Vendor.
- Admins create and configure Stores; Managers and Sales get access via `StoreAccess`.

### StoreAccess
Granular per-store access control connecting `VendorMember` to `Store`.

- Fields:
  - `store` (FK -> `Store`)
  - `member` (FK -> `VendorMember`)
  - `role` (choices): `MANAGER`, `SALES`
  - `custom_permissions` (JSON) — e.g. `{"can_adjust_price": true}`
  - `is_active`, timestamps

Roles:
- `MANAGER` — create/update/remove products, adjust prices, manage store-level metadata.
- `SALES` — view inventory, perform sales operations, cannot change prices or remove products.

### Product (Collectible)
Per-store inventory item.

- Fields:
  - `store` (FK -> `Store`) — primary scoping
  - `vendor` (FK -> `Vendor`) — optional (denormalized or for queries)
  - `name`, `sku`, `description`, `category`, `condition`
  - `image_url` (URL)
  - `quantity` (int)
  - `price` (decimal)
  - `cost_price` / `intake_price` (decimal)
  - `status` (enum): `ACTIVE`, `ARCHIVED`, `DRAFT`
  - `metadata` (JSON) — extensible fields
  - timestamps

Inventory operations:
- Transfer stock between stores: decrement/increment with transactional safety.
- Keep `quantity` per-store; consider `StockLedger` for historical movements.

### Media (Vendor & Store)
Keep media as URLs (Supabase) and create light metadata records if needed.

- `Vendor` media fields: `logo_url`, `banner_url`.
- `Store` media fields: `logo_url`, `banner_url`.
- Optionally, a `Media` table to record uploads with `url`, `type`, `uploaded_by`, `created_at`.

---

## Implementation Plan (Suggested Steps)

1. **Models**: Add `VendorMember`, `Store`, `StoreAccess`, and update `Product` to reference `Store`.
2. **Migrations**: Add migrations with a migration strategy:
   - Create models first (nullable fields where needed).
   - Create a default `Store` for existing Vendors and migrate current `Collectible.vendor` rows into that store.
   - Finally, make the new `store` FK non-nullable if appropriate.
3. **Services**:
   - Add services to invite users to vendors, accept invites, promote/demote members, create stores, assign access.
   - Add store-level permissions checks in service layer.
4. **API Changes**:
   - Endpoints: Invite Member, List Members, Create Store, Assign Store Access, Transfer Product between Stores.
5. **Permissions**:
   - Implement decorators / DRF permissions that check `VendorMember` role and `StoreAccess` for store-scoped operations.
6. **Data Migration**:
   - For existing data, create a "Default Store" per Vendor then reassign products.
7. **Testing**:
   - Add unit & integration tests for role enforcement, store scoping, inventory transfer atomicity.
8. **UI / UX**:
   - Add admin views for managing members and stores.

---

## Additional Suggestions

- Add an audit/logging table (e.g., `StockLedger` or `AuditLog`) to record changes made by users (who performed the action and timestamps).
- Consider soft-delete (`is_active`) on VendorMember and Store to keep history.
- Add indexing on `sku`, `store_id` and search-friendly fields for performance.
- Add webhooks or events for inventory alerts (low stock) and store changes.

---

## Next Steps

- Create the model files and migrations as suggested.
- Implement service layer and tests.
- Update the API and frontend flows (invite flow, store management).


*Prepared by the agent at request of project owner.*

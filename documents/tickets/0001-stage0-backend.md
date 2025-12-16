# Ticket: Stage 0 Backend Foundations

Date: 2025-12-09  
Owner: Backend Team

## Goal
Lay the groundwork for the vendor/store refactor while keeping the current system stable. Focus on schema additions, services, and product image infrastructure that can be toggled off until later stages.

## Tasks

1. **Feature Flags / Settings**
   - Add Django settings (e.g., `ENABLE_VENDOR_REFACTOR`) surfaced via env var.
   - Wire to relevant selectors/services so they can short-circuit until the refactor is ready.

2. **Placeholder Models**
   - Create initial Django models:
     - `VendorMember` (nullable fields, optional constraints)
     - `Store`
     - `StoreAccess`
   - Keep new fields optional so existing data is unaffected.
   - Auto-create migrations but do not enforce new relationships yet.

3. **UserMedia Enhancements**
   - Extend `UserMedia` to support `entity_type`/`entity_id` (user, vendor, store, product).
   - Update service functions to accept metadata for bucket/path.

4. **Product Image Model**
   - Introduce `ProductImage` model with fields:
     - `product` FK
     - `url`
     - `is_primary`
     - `sort_order`
     - `metadata` (JSON)
   - Add database constraint or service-level validation to allow max 5 images per product.

5. **Supabase Upload Helper**
   - Update backend helper/service for uploads (if applicable) to generate product-specific paths (e.g., `product-images/<product-id>/`).

6. **Unit Tests**
   - Add tests for new models/services, including the 5-image validation.

## Definition of Done

- Migrations created and checked in (no breaking changes to existing flows).
- Unit tests green via `pytest`.
- Documentation updated (model README or relevant ADR) to describe new tables and feature flag.


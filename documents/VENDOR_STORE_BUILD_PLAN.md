# Vendor / Store Build Notes

## Current API Baseline (Dec 2025)

- Auth + profile endpoints expose a single vendor association via `user.profile.vendor`. There is no `VendorMember` table in production.
- `/api/v1/vendors/` only supports CRUD on the vendor linked to the user profile. No membership or store metadata is returned.
- `/api/v1/inventory/collectibles/` expects `vendor` ownership only; there is no `store` field, and all permission checks rely on the vendor FK + current user.
- Frontend screens only read/write user metadata (company name, profile avatar). There are no vendor roster or store configuration pages yet.

This is the reference behavior QA will compare against when `ENABLE_VENDOR_REFACTOR` is `false`.

## Rollout Guard

- `ENABLE_VENDOR_REFACTOR` defaults to `false` in all environments. We only flip it to `true` once the new membership/store features are ready end-to-end.
- Backend services (selectors, serializers, permissions) will branch on this flag to avoid affecting the existing flows during incremental merges.

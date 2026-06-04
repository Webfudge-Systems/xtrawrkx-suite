# Auth Active Organization Bootstrap Fix

## Summary
Fixed recurring CRM `403 No active organization` responses by adding backend auth bootstrapping logic that guarantees every authenticated user has at least one active organization membership.

## Scope
- `apps/backend/src/api/auth/controllers/auth.js`
- Affects auth endpoints:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

## Details
- Added `ensureActiveOrganizationMembership(user)` in auth controller.
- On signup/login/me, backend now:
  1. Loads active memberships from `organization-user`.
  2. If none exist, creates a real `organization` record owned by the user.
  3. Creates an active `organization-user` membership (`role: Owner`).
  4. Returns organizations from the newly established membership.
- Slugs are generated from the organization name and user id to avoid collisions.

## Why This Fix
- CRM APIs are tenant-scoped and require `ctx.state.orgId`.
- `ctx.state.orgId` is resolved from active `organization-user` membership.
- If a user has no active membership, all org-scoped endpoints return 403.
- This change resolves the root cause without seed/dummy data by provisioning real tenant linkage for real users.

## Usage / Migration
- No frontend changes required.
- Existing affected users can:
  1. Sign out.
  2. Sign in again (or call `/api/auth/me` once).
  3. Continue using CRM; org-scoped endpoints should stop returning `No active organization`.

# Accounts Organization Settings Update

## Summary

Fixed Organization Settings (Accounts → Organization) so workspace profile fields save reliably and the screen explains who can edit. Empty optional fields no longer send invalid blank strings to Strapi; org owners and Admins can save without requiring CRM/PM settings manage alone.

## Scope

- `apps/accounts/app/settings/page.js` — UI/UX refresh
- `apps/accounts/lib/organizationSettings.js` — form helpers and payload sanitization
- `apps/accounts/lib/api/organizationService.js`, `apps/accounts/lib/strapiClient.js`
- `apps/backend/src/api/organization/controllers/organization.js`
- `apps/backend/src/utils/rbac.js` — `canManageOrganizationProfile`

## Details

### Root cause

Strapi validates `companyEmail` (email) and `industry` / `size` (enumeration). Sending `""` on save caused validation errors. Save permission previously required CRM or PM **settings manage** only, blocking workspace owners with Manager/Member roles.

### Backend

- `pickOrganizationSettings` trims strings and maps blank optionals to `null`.
- `resolveCanEditOrganizationSettings`: Admin role, CRM/PM settings manage, or organization **owner**.
- `GET /organizations/current` includes `canEditOrganizationSettings`.

### Frontend

- Shared `Select` / `Input` with labels, icons, and inline field errors.
- View-only banner when `canEditOrganizationSettings` is false.
- Unsaved-changes state, Discard, and clearer success/error banners.
- `buildOrganizationSettingsPayload` before PATCH (same pattern as CRM proposals/invoices).

## Usage

1. Open Accounts → **Organization** (`/settings`).
2. Edit fields; optional fields can be cleared (stored as null).
3. **Save settings** when enabled; otherwise contact an Admin or owner.

Restart the Strapi backend after pulling backend changes.

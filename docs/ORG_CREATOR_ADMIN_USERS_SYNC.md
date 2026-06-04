# Organization Creator Admin + Users Sync

## Summary
Organization creation now guarantees that the first creator is added as an active **Admin** membership for that organization.
The Accounts Users page now reads organization members from the org-membership API, so creator/admin users appear correctly in the table.

## Scope
- Backend:
  - `apps/backend/src/api/organization/services/organization.js`
  - `apps/backend/src/api/auth/controllers/auth.js`
  - `apps/backend/src/api/organization/controllers/organization.js`
- Frontend:
  - `apps/accounts/lib/api/usersService.js`
  - `apps/landing/app/profile/page.js`

## Details
- Changed creator membership role during onboarding org creation:
  - `Owner` -> `Admin`
- Changed fallback auto-created org membership role in auth bootstrap:
  - `Owner` -> `Admin`
- Updated organization users endpoint response to return flattened user rows with:
  - user fields (`id`, `email`, `username`, `firstName`, `lastName`, `blocked`, `confirmed`, `createdAt`, `updatedAt`)
  - membership metadata (`role`, `membershipId`, `joinedAt`, `lastAccessAt`)
- Updated Accounts users API client:
  - switched from generic `/users` to org-scoped `/organizations/:id/users`
  - reads active org from `current-org-id`
- Updated landing profile navigation to keep org context aligned:
  - when opening an org or app, it sets `current-org-id` in localStorage

## Usage / Migration
- **Restart the backend** after deploy so bootstrap can promote org owners who were incorrectly stored as `Member` to `Admin`.
- For all **newly created organizations**, the creator is stored as `Admin` using Strapi 5 relation `connect`/`set` (see `createOrganizationOwnerMembership` in `apps/backend/src/utils/organization-role.js`).
- Ensure login/profile flow sets `current-org-id` before entering org-scoped apps; this is now handled in landing profile app/org navigation.

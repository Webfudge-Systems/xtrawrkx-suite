# Accounts Users Invite + Edit Flow

## Summary
The Accounts Users page now supports full user-management interactions:
- Invite user modal (add user by email + role)
- Edit user modal (change role and active/suspended status)
- Row action button for user-level management

Backend organization APIs were extended to support membership updates and role-linked organization users.

## Scope
- Frontend:
  - `apps/accounts/app/users/page.js`
  - `apps/accounts/lib/api/usersService.js`
  - `apps/accounts/lib/api/rolesService.js`
  - `apps/accounts/lib/strapiClient.js`
- Backend:
  - `apps/backend/src/api/organization/routes/custom.js`
  - `apps/backend/src/api/organization/controllers/organization.js`

## Details
- Added `Invite User` modal in Accounts Users page:
  - Inputs: email, organization role
  - Checkbox: **Directly add user without invitation**
  - Optional temporary password (direct-add mode)
  - Calls `POST /api/organizations/:id/invite-users`
- Added row action button (`Edit`) and `Edit User` modal:
  - Fields: name (username), email, role, status (`active` / `suspended`)
  - Calls `PATCH /api/organizations/:id/users/:membershipId`
- Added backend endpoint:
  - `PATCH /organizations/:id/users/:membershipId` (`organization.updateUserMembership`)
  - Updates membership role relation, user `email` / `username`, and optionally blocked status
- Extended `POST /organizations/:id/invite-users` to support two modes:
  - `directAdd = false` -> invitation mode (token + email link)
  - `directAdd = true` -> direct add mode (create/add user to org immediately)
- Users API response includes membership IDs and role code/name to support edit UX.
- Accounts role service now uses org role entities:
  - `GET /api/organization-roles`

## Invitation workflow
1. Admin/manager opens **Invite User** modal in Accounts.
2. System stores invitation with:
   - target email
   - organization
   - role
   - token + expiry
3. Invitee accepts invitation link (future email flow / token accept endpoint).
4. On acceptance, backend creates/links user membership in that organization using role relation.
5. User appears in Accounts Users table with role and status.

## Direct-add workflow
1. Admin checks **Directly add user without invitation** in the modal.
2. System resolves target user by email:
   - existing user -> adds/updates organization membership immediately
   - new user -> creates account (optional provided password, else generated)
3. System sends welcome email (when email plugin is configured) with org context and credentials note.
4. User appears instantly in Accounts Users table.

## Notes
- Invitation delivery now attempts actual email send via Strapi email plugin; if no email provider is configured, backend logs warning and continues safely.
- Role access-policy matrix is intentionally deferred; role records and linkage are now ready for permission mapping.

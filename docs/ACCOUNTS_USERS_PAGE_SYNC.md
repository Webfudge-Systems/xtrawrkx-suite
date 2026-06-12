# Accounts Users Page — Xtrawrkx Feature Sync

## Summary

Aligned the Accounts `/users` page and backend membership APIs with the Xtrawrkx suite: admin password reset on edit, suspend/remove with assignment transfer, and org-admin gating for sensitive actions.

## Scope

### Backend (`apps/backend`)

- `src/utils/user-assignment-transfer.js` — reassign CRM/PM open work between org members
- `src/utils/rbac.js` — `canManageOrganizationSecurity`
- `src/api/organization/routes/custom.js` — `DELETE /organizations/:id/users/:membershipId`
- `src/api/organization/controllers/organization.js` — enhanced `updateUserMembership`, new `deleteUserMembership`

### Accounts app

- `lib/api/usersService.js` — `password`, `transferToUserId`, `removeMembership`
- `lib/accountsAccess.js` — `isOrganizationAdmin()`
- `components/TransferUserSelect.jsx` — searchable user picker for assignment transfer
- `app/users/page.js` — edit password, suspend transfer, remove user modals

## Details

### Edit user — change password

- Org admins see a **Change password** checkbox in the edit modal.
- New password must be at least 8 characters.
- Backend updates via Strapi users-permissions `user.edit`.

### Suspend user

- Suspending requires selecting another org member to receive open assignments (leads, deals, projects, tasks, etc.).
- Same transfer picker appears when changing status to Suspended in the edit modal.

### Remove user

- Org admins can **Remove user** from the row action menu.
- Requires assignment transfer before membership is deactivated (`isActive: false`).
- Users cannot remove themselves.

## Usage

- Restart the backend after deploying controller/route changes.
- Password change and remove-user actions require organization **Admin** role in the active workspace.

## Not in scope (yet)

- Department assignment on invite/edit (departments content-type not yet in this platform backend).

# Accounts — User Remove, Suspend & Assignment Transfer

## Summary

Organization admins can **remove** users from the workspace and must **reassign open work** when suspending or removing a user. Assignments move to another active org member in one operation.

## Scope

- **Apps:** `accounts`, `backend`
- **Key files:**
  - `apps/accounts/app/users/page.js`
  - `apps/accounts/components/TransferUserSelect.jsx`
  - `apps/accounts/lib/api/usersService.js`
  - `apps/backend/src/utils/user-assignment-transfer.js`
  - `apps/backend/src/api/organization/controllers/organization.js`
  - `apps/backend/src/api/organization/routes/custom.js`

## Details

### Suspend (deactivate)

- Suspend modal and Edit User form (when changing status to Suspended) require **Transfer assignments to**.
- Backend `PATCH /organizations/:id/users/:membershipId` accepts `transferToUserId` when `status: 'suspended'` and the user was not already suspended.
- User is blocked globally (`user.blocked = true`) after assignments transfer.

### Remove (delete from organization)

- **Remove user** action in the row menu (org admins only).
- `DELETE /organizations/:id/users/:membershipId` with body `{ transferToUserId }`.
- Sets `organization-user.isActive = false` (user disappears from the org list).
- Does not delete the global `up_users` record.
- Admins cannot remove their own account.

### What gets transferred

Within the organization, for the source user → target user:

| Area | Fields |
|------|--------|
| CRM | Leads, contacts, deals, client accounts, proposals, meetings (`assignedTo`, `organizer`), invoices |
| PM | Projects (`projectManager`, `teamMembers`), tasks (`assignee`, `assigner`, `collaborators`, `pendingCollaborators`, `assignmentRequestedBy`) |
| Org structure | Department `lead`, team `leader`, team `members` |
| Ownership | Organization `owner` (if the removed user was owner) |

On **remove only**, the user is also stripped from team membership lists and cleared as department/team lead where they were the sole lead (after transfer).

## Usage

1. Open **Accounts → Users** as an organization admin.
2. **Suspend:** choose **Suspend user** → pick who receives assignments → confirm.
3. **Remove:** row menu → **Remove user** → pick transfer target → confirm.
4. **Edit:** set Status to Suspended → transfer dropdown appears → save.

Restart the backend after deploy so new routes are registered.

## Migration

No data migration. Existing suspended users keep their assignments until an admin re-suspends with transfer or manually reassigns in CRM/PM.

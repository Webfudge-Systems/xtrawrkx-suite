# Accounts — Roles & Permissions (CRM / PM matrix)

## Summary

The Accounts app **Roles & Permissions** page is now functional: organization members see **system role templates** (Admin, Manager, Member) plus **multiple custom roles** scoped to the current organization. Each role persists a JSON **CRM and PM module access matrix** (`none`, `read`, `write`, `manage`). Org **Admins** can create, edit, and delete custom roles via dedicated API routes; assignments use role ids so custom roles work in invite/edit user flows.

## Scope

| Area | Notes |
|------|------|
| `apps/accounts/app/roles/page.js` | KPIs, tabs, table, modals for view/create/edit/delete |
| `apps/accounts/lib/api/rolesService.js`, `usersService.js`, `strapiClient.js` | Org-scoped role CRUD + `DELETE`; membership `roleId` |
| `apps/accounts/app/users/page.js` | Role dropdown reads org roles (`listForOrg`) with id/code selection |
| `apps/accounts/lib/constants/rbacMatrix.js` | Frontend labels aligned with backend module keys |
| `apps/backend/src/constants/rbac-app-matrix.js` | Default matrices for Admin / Manager / Member; normalization |
| `apps/backend/src/api/organization-role/` | Schema: optional `organization`, `permissions` JSON |
| `apps/backend/src/api/organization/` | Handlers `getOrganizationRoles`, `createOrganizationRole`, `updateOrganizationRole`, `deleteOrganizationRole`; `GET /organizations/:id/roles`, etc.; `GET users` includes `roleId` |
| `apps/backend/src/utils/organization-role.js` | System roles use `organization: { $null: true }`; `resolveOrganizationRoleIdForOrg` for invites/memberships |
| `apps/backend/src/api/invitation/services/invitation.js` | Resolves roles per organization; persists role **code** on invitations |

## API

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/organizations/:id/roles` | List system + custom roles with normalized permissions |
| POST | `/api/organizations/:id/roles` | Create custom role (**Admin**, org context matches header) |
| PATCH | `/api/organizations/:id/roles/:roleId` | Update custom role |
| DELETE | `/api/organizations/:id/roles/:roleId` | Delete unused custom role |
| PATCH | `/api/organizations/:id/users/:membershipId` | Optional `roleId` or `roleCode`/`roleName` |

## System role defaults

- **Admin** — Manage access on all CRM and PM modules.  
- **Manager** — Same as Admin except CRM and PM **Settings** remain read-only.  
- **Member** — Contributing access on CRM pipeline areas (leads/companies/meetings/calendar); read on most else; invoices none; operational PM on projects/tasks with no PM settings access.

Stored defaults are seeded/updated at bootstrap (`apps/backend/src/index.js`). CRM/PM apps can later read membership `organization-role.permissions` or `organization-user.customPermissions` to enforce UI/routes.

## Migration

After pulling schema changes, run Strapi so the DB picks up `organization_roles.organization` and `organization_roles.permissions`. Existing system rows get default matrices on bootstrap when `permissions` is empty.

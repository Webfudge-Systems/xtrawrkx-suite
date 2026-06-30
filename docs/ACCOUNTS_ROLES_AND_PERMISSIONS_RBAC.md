# Accounts — Roles & Permissions (CRM / PM matrix)

## Summary

The Accounts app **Roles & Permissions** page lists **system role templates** (Admin, Manager, Member) plus **custom roles** scoped to the current organization. Each role persists a JSON **CRM and PM module access matrix** (`none`, `read`, `write`, `manage`). Org **Admins** can edit system role permissions and descriptions **for their organization** (stored on `organization.systemRolePermissions`), and can create, edit, and delete custom roles.

## Scope

| Area | Notes |
|------|------|
| `apps/accounts/app/roles/page.js` | KPIs, tabs, table, modals for view/create/edit/delete |
| `apps/accounts/lib/api/rolesService.js`, `usersService.js`, `strapiClient.js` | Org-scoped role CRUD + `DELETE`; membership `roleId` |
| `apps/accounts/app/users/page.js` | Role dropdown reads org roles (`listForOrg`) with id/code selection |
| `apps/accounts/lib/constants/rbacMatrix.js` | Frontend labels aligned with backend module keys |
| `apps/backend/src/constants/rbac-app-matrix.js` | Default matrices for Admin / Manager / Member; normalization |
| `apps/backend/src/api/organization-role/` | Schema: optional `organization`, `permissions` JSON |
| `apps/backend/src/api/organization/` | Handlers + `organization.systemRolePermissions` for per-org system role overrides |
| `apps/backend/src/utils/organization-role.js` | System roles use `organization: { $null: true }`; `resolveOrganizationRoleIdForOrg` for invites/memberships |
| `apps/backend/src/api/invitation/services/invitation.js` | Resolves roles per organization; persists role **code** on invitations |

## API

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/organizations/:id/roles` | List system + custom roles with normalized permissions |
| POST | `/api/organizations/:id/roles` | Create custom role (**Admin**, org context matches header) |
| PATCH | `/api/organizations/:id/roles/:roleId` | Update custom role, or system role permissions/description (org-scoped override) |
| DELETE | `/api/organizations/:id/roles/:roleId` | Delete unused custom role |
| PATCH | `/api/organizations/:id/users/:membershipId` | Optional `roleId` or `roleCode`/`roleName` |

## System role defaults

- **Admin** — Manage access on all CRM and PM modules.  
- **Manager** — Same as Admin except CRM and PM **Settings** remain read-only.  
- **Member** — Contributing access on CRM pipeline areas (leads/companies/meetings/calendar); read on most else; invoices none; operational PM on projects/tasks with no PM settings access.

Stored defaults are seeded/updated at bootstrap (`apps/backend/src/index.js`). CRM/PM apps read membership `organization-role` plus org-level `systemRolePermissions` overrides when resolving effective access.

## System role overrides (per organization)

Editing Admin / Manager / Member in Accounts does **not** change global templates for other organizations. Overrides are stored on the active organization:

```json
{
  "manager": {
    "permissions": { "crm": { "modules": { ... } }, "pm": { "modules": { ... } } },
    "description": "Optional org-specific description"
  }
}
```

Only **organization admins** (or users with CRM/PM settings manage access) may create or delete custom roles. **Managers** with delegated module rights may edit **Member** (and custom) permission rows only for modules an admin has delegated. See **[ACCOUNTS_ROLE_PERMISSION_DELEGATION.md](./ACCOUNTS_ROLE_PERMISSION_DELEGATION.md)**.

## Migration

After pulling schema changes, run Strapi so the DB picks up `organization_roles.organization` and `organization_roles.permissions`. Existing system rows get default matrices on bootstrap when `permissions` is empty.

# Accounts — Role permission delegation

## Summary

Organization **Admins** can edit **Admin**, **Manager**, and **Member** permission matrices. Admins may also grant **delegation** on the Manager (or custom) role so Managers can edit **Member** (and custom) permissions for specific CRM/PM modules — for example **Projects** — without full admin access. **Members** cannot manage roles.

## Scope

| Area | Change |
|------|--------|
| `apps/backend/src/constants/rbac-app-matrix.js` | `permissions.delegation` block on role JSON |
| `apps/backend/src/utils/rbac.js` | `canManageRolePermissions`, `canEditTargetRolePermissions`, `sanitizeRolePermissionsForEditor` |
| `apps/backend/src/api/organization/controllers/organization.js` | Enforce rules on role CRUD; return `meta.roleManagement` |
| `apps/accounts/app/roles/page.js` | Delegation UI, partial edit for managers |
| `apps/accounts/lib/accountsAccess.js` | Client-side capability helpers |

## Permission JSON shape

```json
{
  "crm": { "modules": { "leads": { "access": "manage" } } },
  "pm": { "modules": { "projects": { "access": "write" } } },
  "delegation": {
    "crm": { "modules": { "leads": { "access": "none" } } },
    "pm": { "modules": { "projects": { "access": "manage" } } }
  }
}
```

- **`crm` / `pm`** — app access for users with this role.
- **`delegation`** — which modules this role may assign when editing **other** roles (Admin configures this on Manager).

## Rules

| Actor | Can edit roles | Can set delegation | Typical targets |
|-------|----------------|--------------------|-----------------|
| Admin | All system + custom | Yes | Admin, Manager, Member, custom |
| Manager (with delegation) | Member + custom only | No | Member, custom — only delegated module rows |
| Manager (CRM/PM settings manage) | Member + custom | No | All modules in that app’s settings scope |
| Member | None | No | — |

## How to delegate (example)

1. Sign in as **Admin** → Accounts → **Roles & Permissions**.
2. Edit the **Manager** system role.
3. Under **Permission delegation**, set **PM → Projects** to **Can assign permissions**.
4. Save. Managers must **sign in again** (or switch org) to refresh stored permissions.
5. Manager opens **Member** role → can change only **Projects** (and any other delegated modules).

## API

`GET /api/organizations/:id/roles` now includes:

```json
{
  "data": [{ "id": 1, "code": "member", "canEdit": true, "...": "..." }],
  "meta": {
    "roleManagement": {
      "canManageRoles": true,
      "canCreateCustomRoles": true,
      "canEditDelegation": true,
      "editableModules": { "crm": ["leads"], "pm": ["projects"] }
    }
  }
}
```

Updates are sanitized server-side; clients cannot escalate beyond delegated modules.

# Fudge Base (Accounts) — Greenways parity update

## Summary

Aligned `apps/accounts` with `greenways_suite/apps/accounts` for department-wise org administration: full CRUD pages, user department assignment, security settings, and matching API/backend support.

## Scope

### Frontend (`apps/accounts`)

| Area | Change |
|------|--------|
| **Users** | Department multi-select on invite/edit (`DepartmentPillMultiSelect`) |
| **Departments** | Full hierarchy CRUD (was scaffold) |
| **Teams** | Full CRUD with leader, members, department (was scaffold) |
| **Security** | Org security policies form (admin-only) |
| **Billing** | Billing overview page (was scaffold) |
| **Sidebar** | Fudge Base branding, admin-gated Security, Teams wired to `/teams` |
| **API client** | `X-Department-Id` header + full `departmentsService` / `teamsService` |
| **Access** | `lib/accountsAccess.js` — `isOrganizationAdmin()` |

### Backend (`apps/backend`)

| Area | Change |
|------|--------|
| **Organization schema** | `securitySettings` JSON field |
| **Organization API** | `GET/PATCH /organizations/:id/security-settings` |
| **Users API** | `departmentIds` / `primaryDepartmentId` on invite & membership update |
| **Invitation service** | Applies department membership on direct add |
| **RBAC** | `canManageOrganizationSecurity()` |

## Local dev

- Accounts: http://localhost:3003
- After schema changes: restart backend; for clean data run `npm run reset:db` (see `docs/LOCAL_DB_RESET.md`)

## Not ported (intentional)

- Greenways `/coming-soon` teams nav — Xtrawrkx uses live `/teams` route
- Greenways billing hidden from sidebar — Xtrawrkx keeps billing off sidebar (page at `/billing`, link from dashboard if needed)

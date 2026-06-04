# Accounts Users Page Table UI Update

## Summary
The Accounts `Users` module was upgraded from a placeholder shell to a working, organization-scoped list page.
It now follows the same UI composition used in CRM list views: page header, KPI cards, tabbed filters, searchable table, and pagination.

## Scope
- App: `apps/accounts`
- Route: `apps/accounts/app/users/page.js`
- Data source: `apps/accounts/lib/api/usersService.js`
- Shared UI: `@webfudge/ui` components (`KPICard`, `TabsWithActions`, `Table`, `Pagination`, `LoadingSpinner`, table cells)

## Details
- Replaced `AccountsModuleShell` usage on `/users` with a full list implementation.
- Added live user fetch from `usersService.list()` and normalized response handling.
- Added KPI cards:
  - Total Users
  - Active Users
  - Invited Users
  - Suspended Users
- Added tabs with counts and client-side filtering:
  - All Users
  - Active
  - Invited
  - Suspended
- Added search across user display name, email, and role.
- Added table columns aligned with CRM list style:
  - User
  - Email
  - Role
  - Status
  - Created
  - Last Updated
- Added loading, empty state, and paginated results rendering.

## Usage / Notes
- Users are fetched in an org-scoped context through existing auth and `X-Organization-Id` header flow in `strapiClient`.
- Invite button is included in the UI to match CRM patterns; current handler is intentionally a placeholder until invite flow route/API is finalized.

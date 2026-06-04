# Accounts App Foundation

## Summary
Implemented the foundational `apps/accounts` workspace aligned to CRM and PM architecture so Accounts now runs with the same app-shell, auth provider integration, workspace header style, and module routing baseline.

## Scope
- `apps/accounts`
  - `app` routes for dashboard, login, unauthorized, and core module pages
  - `components` for layout shell, sidebar, header wrapper, and module shell
  - `lib/strapiClient.js` and modular `lib/api` service files
  - Tailwind/theme and package dependency alignment with CRM/PM patterns
- `docs`
  - Added this implementation summary

## Details
- Root layout now uses `AuthProvider` from `@webfudge/auth` and `AppShell` from `@webfudge/ui` through `LayoutContent`.
- Added enterprise sidebar/navigation and a shared `AccountsPageHeader` wrapper around `WorkspaceHeader` (matching CRM/PM header behavior and notification service injection).
- Added an org-aware API client (`X-Organization-Id` + bearer token) consistent with existing multi-tenant request patterns.
- Added modular service placeholders:
  - `usersService`
  - `rolesService`
  - `departmentsService`
  - `teamsService`
  - `auditService`
  - `organizationService`
  - `billingService`
  - `notificationService`
- Added core route scaffolds:
  - `/`
  - `/login`
  - `/unauthorized`
  - `/users`
  - `/roles`
  - `/departments`
  - `/teams`
  - `/security`
  - `/audit-logs`
  - `/settings`
  - `/billing`
  - `/app-access`

## Usage / Next Steps
- Wire each service to finalized backend endpoints/content types as they are introduced.
- Expand module pages from shells into full data tables/forms using shared `@webfudge/ui` components (`Table`, `TabsWithActions`, `FormSectionCard`, `ActivitiesTimeline`, etc.).
- Add explicit route-level guard checks where role-specific restrictions are required.

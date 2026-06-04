# PM + CRM RBAC Foundation

## Summary

This update makes the existing CRM/PM permission matrix authoritative across backend auth context, Accounts administration, and the first layer of PM/CRM frontend access control.

The implementation focuses on the foundation pass: role permissions now resolve from organization role templates plus membership overrides, PM/CRM apps receive effective permissions through auth payloads, and UI modules/actions are gated by `none`, `read`, `write`, and `manage` access levels.

## Scope

- Backend RBAC helper and JWT/auth payload wiring.
- Accounts role presets, organization settings, and app access summaries.
- Shared auth helpers for matrix-compatible checks.
- PM sidebar, dashboard, and route shell gating.
- CRM sidebar, dashboard widgets, quick actions, and route shell gating.

## Details

The backend resolver lives in `apps/backend/src/utils/rbac.js`. It normalizes role permissions from `organization-role.permissions`, applies `organization-user.customPermissions`, preserves Admin override behavior, and exposes helper checks for controllers.

`/api/auth/login`, `/api/auth/signup`, and `/api/auth/me` now include effective organization permissions so PM and CRM clients can evaluate the same matrix edited from Accounts.

Accounts now has functional organization settings and app access screens:

- `apps/accounts/app/settings/page.js` edits shared organization metadata.
- `apps/accounts/app/app-access/page.js` shows CRM/PM role access summaries.
- `apps/accounts/app/roles/page.js` includes Admin-like, Manager-like, and Member-like presets for custom role creation.

PM and CRM route shells block direct rendering when the active role lacks read access to the current module. Sidebars and quick actions hide modules requiring unavailable access.

## Permission Model

- `none`: no module visibility.
- `read`: module visibility and read-only screens.
- `write`: create/update actions where allowed by module workflow.
- `manage`: destructive or administrative actions.

The first pass also adds focused backend guards to the primary PM/CRM controller surfaces for projects, tasks, leads, contacts, deals, proposals, and invoices. CRM members have `write` access for lead and contact modules, with row-level owner checks limiting edits to records assigned to them unless their role has `manage` access. Deals and client accounts remain read-only for members. Proposals and client invoices are unavailable to members and show a no-access banner on direct navigation.

## Deferred Items

This pass does not add WebSocket transport. Chat, notifications, read receipts, and live updates remain modeled as persisted data and can be upgraded later.

The deeper vertical-slice workflows are also deferred:

- PM task request approval queue.
- Manager-only project membership enforcement.
- Additional CRM row-level rules beyond leads, contacts, deals, and client-account deletion.
- Complete audit trail coverage for every admin action.

## Validation

Validate with Admin, Manager, and Member roles:

- `/api/auth/me` returns each organization with `permissions.crm` and `permissions.pm`.
- Accounts role changes affect PM/CRM navigation after login or auth refresh.
- PM modules respect dashboard, projects, tasks, inbox, calendar, analytics, and settings access.
- CRM modules respect dashboard, leads, contacts, deals, client accounts, invoices, proposals, meetings, calendar, analytics, and settings access.

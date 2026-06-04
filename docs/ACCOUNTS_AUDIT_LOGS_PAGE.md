# Accounts Audit Logs Page

## Summary
The Accounts `Audit Logs` route is now an organization-wide audit center aligned with CRM activity-log UX. It tracks who did what, when, where, and what changed across modules like Accounts, CRM, and PM.

## Scope
- App route: `apps/accounts/app/audit-logs/page.js`
- API service: `apps/accounts/lib/api/auditService.js`
- Shared UI: `@webfudge/ui` (`KPICard`, `Table`, `Pagination`, `LoadingSpinner`, `Button`, `Modal`, `ActivitiesTimeline`, `Avatar`, `TableCellText`, `TableCellTitleSubtitle`, …)

## Details
- Rebuilt page around enterprise audit-log requirements:
  - **Who**: actor/user column
  - **What**: action + description
  - **When**: timestamp
  - **Where**: module (`accounts`, `crm`, `pm`, etc.)
  - **What changed**: before/after JSON in detail modal
- Added KPI cards:
  - Total events
  - Authentication events
  - Data-change events
  - High-risk (high/critical severity) events
- Filters grouped in primary/secondary rows (date, module, severity, search; user, action, entity, event type).
- Upgraded table columns:
  - Time
  - User
  - Action
  - Module
  - Entity
  - Severity
  - Type
- Added row click interaction with a details modal:
  - Full event context
  - Before/After JSON
  - Metadata (IP/device)
  - Related records payload
- Kept refresh and pagination behavior aligned with CRM/Accounts list pages.
- Added a persisted **multi-view switcher** for log results:
  - **Table view** for dense auditing and column-based scanning
  - **Timeline view** for event-flow readability (created → assigned → moved → completed style)
  - Uses shared `ViewToggleGroup` / `ViewToggleButton` pattern to stay consistent with PM/CRM table tab toolbars.

- **Entity column (clickable)** opens a **right-hand drawer** (not the row modal):
  - **Full history**: `GET /api/crm-activities/timeline` via `auditService.entityTimeline()` with the correct scope (`taskId`, `dealId`, `leadCompanyId`, etc.)
  - **Interactive timeline** uses `ActivitiesTimeline` with `onItemClick` / `selectedItemId` for selection
  - **Before / after** for the selected timeline entry (normalized `before` / `after`)
  - **Metadata** JSON (id, action, subject, summary, parsed `meta`, timestamps)
  - **Related logs**: rows in the current loaded audit feed that match the same `entityType` + `subjectId`; each row opens the existing **event modal**
- Optional **Open in CRM** link when `NEXT_PUBLIC_CRM_ORIGIN` is set (e.g. `http://localhost:3001`).

## `ActivitiesTimeline` updates
- Optional props: `onItemClick(row)`, `selectedItemId` — used by the entity drawer for keyboard-focusable selection styling.
- The main Accounts audit list now also supports timeline rendering in-page (not just inside entity drawer history).

## API behavior
- `auditService.list()` reads from `GET /api/crm-activities/feed` (org-wide activity, paginated).
- `auditService.entityTimeline(params)` calls `GET /api/crm-activities/timeline` with **exactly one** entity scope parameter (same contract as CRM entity timelines: `taskId`, `dealId`, `leadCompanyId`, etc.).
- Incoming rows are normalized to a common structure (`actor`, `action`, `module`, `entityType`, `severity`, `before/after`, metadata) so mixed sources are rendered consistently.
- Field-level changes from `meta.changes` are transformed into before/after JSON sections in the details modal.
- If there are no DB rows, the page now shows an empty state (no sample/fallback records).
- Unauthorized responses clear auth storage and redirect to `/login`.

## Next backend step (optional)
- Add a dedicated backend audit log content type and endpoint so the same page can run fully on persisted org-scoped events without fallback.

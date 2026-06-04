# PM Inbox — Activity, Alerts, Threads

## Summary

The PM **`/inbox`** route is a three-tab hub (no KPI row): **All activity** (org-scoped project + task CRM audit feed), **Notifications & alerts** (existing notification API with All / Unread / Read / **Archived** via `localStorage`), and **Threads** (project + task CRM comment threads with reply — powered by **`PmInboxThreadsTab`**).

## Backend

- **`GET /crm-activities/feed`** accepts optional **`subjectTypes`** (comma-separated, e.g. `project,task`) to filter rows before pagination.

## Frontend

- **`apps/pm/lib/api/pmInboxService.js`** — `fetchPmActivityFeed`, `fetchPmThreadsCommentsFeed`.
- **`apps/pm/components/PmInboxThreadsTab.jsx`** — threads UI aligned with CRM `/threads`, scoped to PM entities only.

## Archive

Notification archive IDs are stored under **`pm-inbox-archived-notification-ids`** in `localStorage` (no schema change on `notification`).

# CRM sidebar navigation refactor

## Summary

The CRM sidebar uses **Quick Actions** directly under the header (no sidebar search). **Navigate** is a 2×2 grid: Dashboard, Sales, Communication, Clients. **Analytics** opens from the bottom **System** section (same as the legacy layout). The scrollable column includes **Navigate**, **Activity**, **My work**, **System** (Analytics + Automation), and the **user** profile in one flow (nothing pinned to the viewport bottom). **System** also includes **Automation** links. **Delivery** and standalone **Client Portal** were removed from the top-level shell; client-facing items live under **Clients**. PM/delivery tasks remain reachable via **Quick Actions → Add Task** and **My work → All tasks** (`/delivery/tasks`).

## Scope

| Area | Files / endpoints |
|------|-------------------|
| Sidebar UI | `apps/crm/components/CRMSidebar.jsx` |
| Shared nav config | `apps/crm/lib/navigation.js` |
| Activity feed API | `GET /api/crm-activities/feed` — `apps/backend/src/api/crm-activity/controllers/crm-activity.js`, `routes/crm-activity.js` |
| My Work API | `GET /api/tasks/my-work` — `apps/backend/src/api/task/controllers/task.js`, `routes/custom-task.js` |
| CRM client | `apps/crm/lib/api/crmActivityService.js` (`fetchGlobalActivityFeed`), `apps/crm/lib/api/taskService.js` |
| Hub pages | `apps/crm/app/communication/page.js`, `apps/crm/app/analytics/page.js` |
| Deal → client | When a deal’s `stage` is **won** and `clientAccount` is empty, the deal update handler links an existing **client account** with `convertedFromLead` matching the deal’s **lead company** — `apps/backend/src/api/deal/controllers/deal.js` |

## Behaviour notes

- **Activity feed**: Uses existing `crm-activity` rows for the active organization (no new table). Rows with `subjectType` `contact`, `lead_company`, or `deal` navigate to the matching CRM detail route when clicked.
- **My work**: Aggregates tasks where the user is **assignee** or **collaborator**, excludes `COMPLETED` / `CANCELLED`, buckets by `scheduledDate` (today, overdue, upcoming within 14 days). Tasks without a date are listed under **Upcoming** for visibility.
- **Future**: The feed is polled every 30s (same pattern as before for conversations); WebSocket updates can replace polling later.

## Migration / usage

- Use **Clients** in the sidebar for accounts, invoices, and projects. **Workspace** includes proposals and tasks (URLs under `/clients/proposals` and `/clients/tasks`).
- Use the **PM app** for projects and delivery workstreams; CRM no longer exposes **Delivery** as a primary tab.

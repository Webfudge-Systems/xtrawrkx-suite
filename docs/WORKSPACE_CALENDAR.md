# Workspace calendar (CRM + PM)

## Summary

A unified **Calendar** shows CRM meetings, scheduled tasks (`scheduledDate`), and project timelines (`startDate` / `endDate`) from the same Strapi backend. **CRM** (`/calendar`) and **PM** (`/calendar`) use the same UI (`UnifiedWorkspaceCalendar` in `@webfudge/ui`), shared event shaping (`@webfudge/utils`), and the same load/query logic pattern.

## Scope

| Area | Files |
|------|--------|
| Event model | `packages/utils/src/workspace-calendar/buildEvents.js` |
| Calendar UI | `packages/ui/components/UnifiedWorkspaceCalendar/` |
| CRM page | `apps/crm/app/calendar/page.js`, `apps/crm/lib/loadWorkspaceCalendar.js`, `apps/crm/components/WorkspaceCalendarClient.jsx` |
| PM page | `apps/pm/app/calendar/page.js`, `apps/pm/lib/loadWorkspaceCalendar.js`, `apps/pm/components/WorkspaceCalendarClient.jsx` |
| Navigation | `apps/crm/lib/navigation.js`, `apps/crm/components/CRMSidebar.jsx`, `apps/pm/components/PMSidebar.jsx` |

## Behavior

- **Month / week / day** views via FullCalendar; orange-styled toolbar. **Meetings**: two-row pastel card with **time in the header** only; title in the body. **Tasks**: compact chip (no clock — ref. “Untitled UI” style); **projects**: gradient roadmap bar (title + icon). Tags, status, project names, and repeat rules appear in the **hover panel**, not on the card. **Hover** uses `pointer-events: none` on the tooltip and clears **as soon as the cursor leaves the event** (no sticking open while moving to the panel).
- **Filters**: All, Meetings, Tasks, Projects (client-side filter on merged events).
- **Fetch**: On each visible range change (`datesSet`), loads meetings and tasks with `scheduledDate` in range, **plus** all tasks with `recurrenceFrequency ≠ none` (so repeating series can render occurrences that fall in the range even when the stored `scheduledDate` anchor is outside it). Projects: page 200, filtered to overlap the visible range.
- **Recurrence**: Uses the same rules as `apps/backend/src/utils/task-recurrence.js` (`daily` / `weekly` / `monthly` / `custom`). Occurrences are expanded in `@webfudge/utils` and **calendar events are sorted by start time** (then kind).
- **CRM**: Click meeting → `/meetings/:id`; task → `/clients/tasks`; project → PM app `NEXT_PUBLIC_PM_APP_URL` + `/projects/:slug` (default `http://localhost:3002`). Scheduled meetings can be **dragged/resized** when status is `scheduled` (updates via `meetingService.update`).
- **PM**: Click meeting → CRM `NEXT_PUBLIC_CRM_APP_URL` + `/meetings/:id` (default `http://localhost:3001`); task → `/tasks/:id`; project → `/projects/:slug`. Meetings are read-only (no drag).

## Environment

| Variable | Used when |
|----------|-----------|
| `NEXT_PUBLIC_PM_APP_URL` | CRM calendar → open project in PM |
| `NEXT_PUBLIC_CRM_APP_URL` | PM calendar → open meeting in CRM |

## Migration / usage

No migration. Run `npm install` at repo root after pulling so `@fullcalendar/*` in `packages/ui` is installed.

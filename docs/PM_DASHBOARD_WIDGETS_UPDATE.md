# PM Dashboard Widgets Update

## Summary
PM dashboard layout updated to match the reference: **Upcoming Deadlines** (task list + mini calendar) and **Activity Feed** replace the sidebar **Projects** card. **My Tasks** remains full-width above those sections.

## Scope
- `apps/pm/app/page.js` — layout, data loading (`assigneeTasks` for deadlines)
- `apps/pm/components/dashboard/UpcomingDeadlinesWidget.jsx` — new
- `apps/pm/components/dashboard/DashboardActivityFeedWidget.jsx` — new (uses `fetchPmActivityFeed`)
- `apps/pm/components/dashboard/DashboardPageSkeleton.jsx` — skeleton layout

## Details
### Removed
- Dashboard **Projects** card (create button + project list). Projects remain in sidebar and `/projects`.

### Added
- **Upcoming Deadlines**: open assignee tasks with due dates, date badges, “days left” labels, mini month calendar with deadline dots, link to `/calendar`.
- **Activity Feed**: org-wide PM activity (`project` + `task` subjects) via `/crm-activities/feed`, compact rows with `@webfudge/ui` `Avatar`, action icons, link to `/inbox` for full feed.

### Unchanged
- KPI row, **My Tasks** table, **People** + **Private Notepad** cards.

## Bottom insight row (May 2026)
### Removed
- **AI Assistant** card and `AIAssistantWidget.jsx` (placeholder Beta UI).

### Layout
- Three equal columns on `lg+`: **Task Overview**, **Team Workload**, **Projects Overview** (`lg:grid-cols-3`, content-sized — no forced min-height).

### UI polish (compact)
- Shared `DashboardInsightShell`: `p-4` cards, `text-base` titles, light gray inner panel.
- Smaller donut + side legend (full labels, no truncation).
- List rows: `py-2`, single-line meta + thin progress bar (`DashboardProgressRow`).

## Components
Uses shared `@webfudge/ui`: `Card`, `KPICard`, `Table`, `Avatar`, `Button`, `EmptyState`, `LoadingSpinner`, `ownerDisplayFromUser`.

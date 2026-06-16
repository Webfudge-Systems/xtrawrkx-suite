# Client Portal Projects — PM Alignment

## Summary

Client portal **Projects** list and detail pages now mirror the PM projects UX: same table columns, sorting, column picker, resizable widths, list/kanban views, KPI cards, status tabs, and detail layout (meta bar, KPI row, overview/tasks/activity/files tabs).

## Scope

| Area | Changes |
|------|---------|
| `apps/xtrawrkx-client-portal/src/app/(protected)/projects/page.jsx` | Full PM-style list page |
| `apps/xtrawrkx-client-portal/src/app/(protected)/projects/[id]/page.jsx` | PM-style detail page |
| `apps/xtrawrkx-client-portal/src/lib/api/clientProjectService.js` | `getProjectForClient`, shared transform |
| `apps/xtrawrkx-client-portal/src/lib/api/clientProjectTransform.js` | Row shaping (progress, team, tasks) |
| `apps/xtrawrkx-client-portal/src/components/projects/ClientProjectDetailMetaBar.jsx` | Meta bar (client read-only) |
| `apps/backend/src/api/project/` | `GET /projects/get-for-client/:id`, list populates `tasks` |

## List page features

- KPI cards: Total, Active, In Progress, Completed
- Status tabs: All, Active, Planning, In Progress, On Hold, Completed
- Views: **List** (table) and **Kanban** (read-only by status)
- Table columns (toggleable/reorderable/resizable): Name, Status, Progress %, Owner, Due date, Start, Tasks, Team, Budget, Description, Created, Updated, Actions
- Multi-column sort (`useTableSort` + `TableSortDropdown`)
- Client-side pagination (12 per page)
- Row actions: View, Copy link
- Create project modal (unchanged)

## Detail page features

- Header with breadcrumb, copy link, refresh
- `ClientProjectDetailMetaBar` — organization, status, updated, team stack
- KPI row: Total tasks, Completed, Progress %, Team size
- Tabs: Overview, Tasks (shared only), Activity (discussion), Files (placeholder)
- Overview: project info card, team grid, owner card, delivery progress sidebar
- Tasks tab: `@webfudge/ui` `Table` linking to `/tasks/[id]`

## API

- `GET /projects/list-for-client` — now populates `tasks` for progress counts
- `GET /projects/get-for-client/:id` — scoped single project (id or slug)

Restart Strapi after backend deploy.

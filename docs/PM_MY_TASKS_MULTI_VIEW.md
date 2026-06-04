# PM My Tasks — Multi-view (List, Table, Kanban, Timeline)

## Summary

The PM **My Tasks** page (`/my-tasks`) supports four layouts: **List** (grouped by status), **Table** (existing grid), **Kanban** (CRM pipeline-style columns with drag-and-drop status changes), and **Timeline** (Gantt-style bars from start → due). The active layout is stored in `localStorage` under `pm.myTasks.taskView`.

## Scope

- **Apps:** `apps/pm`
- **UI package:** `packages/ui` — `TabsWithActions` accepts optional `afterTabs` (rendered immediately after status tabs, before search/actions). View icons use **`ViewToggleGroup`** + **`ViewToggleButton`** (segmented pill chrome).
- **New:** `apps/pm/components/MyTasksViews.jsx` — list, kanban (`@dnd-kit/core`), timeline; re-exports `isTaskOverdue` for the page.
- **Dependencies:** `@dnd-kit/core` on `@webfudge/pm`.

## Behavior

| View       | Notes |
| ---------- | ----- |
| List       | Sections per workflow status (To Do → Cancelled); inline status/priority selects. |
| Table      | Unchanged table, column picker, bulk edit. |
| Kanban     | Columns match deal pipeline styling; drag card onto column calls `updateTask` with `status`. Status tabs filter visible columns (e.g. **To Do** shows only that column). |
| Timeline   | Horizontal track from min/max of task `startDate` / `dueDate`; tasks without dates appear under **No schedule**. |

Bulk edit and the column-visibility (eye) control only apply in **Table** view. Switching away clears bulk selection and closes the column picker.

## Usage / Migration

No migration. Pull deps (`npm install` at repo root). Optional: clear `pm.myTasks.taskView` in devtools to reset the default (table).

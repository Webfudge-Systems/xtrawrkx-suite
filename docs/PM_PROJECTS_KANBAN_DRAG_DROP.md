# PM Projects Kanban Drag and Drop

## Summary

Projects Kanban view now supports drag-and-drop between status columns, matching the My Tasks Kanban behavior (`@dnd-kit/core`). Dropping a card on a column updates the project status via the existing `updateProject` API.

## Scope

- `apps/pm/components/ProjectsKanbanBoard.jsx` (new)
- `apps/pm/app/projects/page.js` (Kanban branch uses the board component)

## Details

- Columns: Planning, Active, In Progress, On Hold, Completed (Cancelled excluded from the board).
- Drag uses a 6px activation distance so clicking the project title still navigates to the detail page.
- Cards are draggable only when `canEditProjectInPm` allows edit for the current user.
- Column headers highlight on drag-over; empty columns show “Release to move here”.

## Usage

1. Open **Projects** → switch to Kanban view.
2. Drag a project card into another status column.
3. Status persists after drop (page reloads project list from API).

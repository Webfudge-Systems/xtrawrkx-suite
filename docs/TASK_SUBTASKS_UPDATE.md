# Task subtasks (parent / children)

## Summary

Tasks support a **parent → subtasks** hierarchy (`parent` / `subtasks` on `api::task.task`). The PM app lists **root-visible** rows (hide a child when its parent is in the same list), adds an **inline expand row** under tasks in My Tasks and project task tables, and a **Subtasks** tab on the task detail page with **Add subtask**. The Strapi task controller validates parent org scope and prevents cycles.

## Scope

| Area | Files / notes |
|------|-----------------|
| Schema | `apps/backend/src/api/task/content-types/task/schema.json` — `parent` (manyToOne self), `subtasks` (oneToMany, mappedBy `parent`) |
| API | `apps/backend/src/api/task/controllers/task.js` — `resolveParentTaskOrError` on create/update when `parent` is sent |
| PM API client | `apps/pm/lib/api/taskService.js` — `populate` for `parent` + `subtasks` (field `name`, not `title`); `normalizeTaskPayload` maps `parentId` → `parent`, strips `subtasks` from writes |
| Transformers | `apps/pm/lib/api/dataTransformers.js` — `parentId`, `parentTask`, `subtasks` / `subtaskCount` on `transformTask` |
| UI shared | `apps/pm/components/TaskSubtasksTableExtras.jsx` — toggle + expand row; `packages/ui/components/Table/Table.jsx` — optional `renderAfterRow` |
| My Tasks | `apps/pm/app/my-tasks/page.js` — `tableRootTasks`, expand state, `QuickCreateTaskModal` + `parentContext` |
| Project tasks | `apps/pm/components/ProjectTasksPanel.jsx`, `apps/pm/app/projects/[slug]/page.js` — same patterns + `onOpenCreateSubtask` |
| Task detail | `apps/pm/app/tasks/[id]/page.js` — Subtasks tab, parent link on Overview, second modal for new subtask |
| Quick create | `apps/pm/components/QuickCreateTaskModal.jsx` — `parentContext`, no recurrence block for subtasks |

## Behavior

- **List rows**: A task is shown as a top-level row if it has **no parent**, or its **parent id is not** in the loaded task id set (e.g. assignee only on a subtask whose parent is not in your merged list).
- **Expand**: List-tree icon toggles a row below the task with subtask links + **Add subtask** (opens create modal with `parentId`).
- **Backend**: Parent must exist, belong to the same organization, cannot be self, and cannot create a **cycle** when walking `parent` upward from the new parent.

## Usage / migration

- **Create subtask from UI**: Task detail → Subtasks → Add subtask; or expand a row in My Tasks / project tasks → Add subtask.
- **API create** (existing Strapi pattern): send `data: { parent: <numeric id>, ... }` or from PM client `parentId` in the object passed to `taskService.createTask` (normalized server-side).
- **Populate**: Use `populate[parent]` and `populate[subtasks]` (or nested populate) on GET; list endpoints already request lightweight subtask fields for badges.

No DB migration beyond the existing `parent` / `subtasks` relations on the Task content type.

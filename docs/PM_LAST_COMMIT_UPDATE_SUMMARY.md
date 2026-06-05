# PM Update — Cross-Suite Sync Guide

> **Audience:** `greenway-suite`, `xtrawrkx-suite`, and any fork that mirrors Webfudge PM.  
> **Purpose:** Single reference so humans and **Cursor** can port the same PM changes into another codebase.  
> **Source of truth:** `webfudge-platform` — base commit `5a36f712` (5 Jun 2026) + follow-up **reporter edit/delete** for org Members.

---

## How to use this doc (Cursor / developers)

1. Open the **target suite** repo (`greenway-suite` or `xtrawrkx-suite`).
2. Work **backend first**, then **PM frontend** — order matters for schema and API gates.
3. For each section below, use the **Sync checklist** and **File mapping** to find equivalent paths in the target repo (paths may differ; match by module/responsibility).
4. Replace blanket `isPmMember` / `memberScopedTasks` UI gates with `canEditTaskInPm` / `canDeleteTaskInPm` from `pmOrgRoles.js`.
5. After each section, run the **Verification** steps at the bottom.
6. **Do not** rename Strapi field `assigner` — only UI labels become **Reporter**.

### Suggested Cursor prompt (paste into target repo)

```
Read docs/PM_LAST_COMMIT_UPDATE_SUMMARY.md (or this file if copied over).
Port all PM changes from webfudge-platform into this repo:
1) project isPrivate + rbac helpers
2) task controller permission refactor
3) pmOrgRoles.js helpers including isTaskReporter
4) taskListUtils.js
5) Reporter label + Project Manager on tasks
6) subtask promote + single assignee
7) replace isPmMember gates with canEditTaskInPm/canDeleteTaskInPm
Match existing code style. Backend before frontend. List files changed when done.
```

---

## Change overview

| # | Feature | Backend | PM frontend | Breaking? |
|---|---------|---------|-------------|-----------|
| 1 | Private projects (`isPrivate`) | Schema + controllers + `rbac.js` | Add/edit forms, list lock, meta badge | No — default `false` |
| 2 | Task permissions (team-scoped assignees) | `task.js` create/update validation | `pmOrgRoles.js`, modals, tables | No |
| 3 | Reporter edit + delete (Member) | `task.js` update + delete gates | `isTaskReporter`, `canEdit/DeleteTaskInPm` | No — expands Member access |
| 4 | Assigner → Reporter (UI labels only) | — | Tables, modals, detail, sort labels | No |
| 5 | Project Manager on task rows | `buildTaskPopulateConfig` | `taskService`, `dataTransformers`, `taskListUtils` | No |
| 6 | Subtasks: single assignee, promote to major | `clampSubtaskToSingleAssignee` | `promoteSubtaskToMajorTask`, modals | No |
| 7 | Major-task list filtering | — | `taskListUtils`, dashboard, My Tasks | No |

---

## 1. Private projects (`isPrivate`)

### Behavior

| Org role | Public project | Private project |
|----------|----------------|-----------------|
| **Admin** | See + edit all | See + edit all |
| **Manager** | See all; edit only if assigned PM | Hidden unless on team; edit only if assigned PM |
| **Member** | Only if on project team | Only if on project team |

### Sync checklist — backend

- [ ] Add to **project schema** (`schema.json`):

```json
"isPrivate": {
  "type": "boolean",
  "default": false
}
```

- [ ] In **`rbac.js`**, add and export:
  - `projectIsPrivate(project)`
  - `buildProjectListFiltersForUser(ctx, orgId, userId)` — Manager: public OR on team; Member: on team only; Admin: org filter only
  - `userCanViewProjectRow(ctx, project, userId)` — Manager may view public projects without being on team
- [ ] **Project controller** `find`: use `buildProjectListFiltersForUser` instead of hard-coded member `$or`
- [ ] **Project controller** `findOne` + `summary`: gate with `userCanViewProjectRow` for non-admins (not only members)
- [ ] **Task controller**: replace `projectIdsForMember` → `projectIdsVisibleToUser`; replace `memberMayViewTask` → `userMayViewTask` (pass `ctx` for role-aware private checks)
- [ ] Regenerate Strapi types if the target repo uses `contentTypes.d.ts`
- [ ] Restart Strapi after deploy

### Sync checklist — PM frontend

- [ ] `pmOrgRoles.js`: `canToggleProjectPrivacy()` — admin only
- [ ] `dataTransformers.js` `transformProject`: map `isPrivate`
- [ ] `projects/add/page.js` + `projects/[slug]/edit/page.js`: admin-only **Private project** checkbox; send `isPrivate` on create/update
- [ ] `projects/page.js`: `Lock` icon next to name when `row.isPrivate`
- [ ] `ProjectDetailMetaBar.jsx`: **Private** badge with lock icon

---

## 2. Task permissions & assignment rules

### Member task access matrix (current rules)

| Member relationship to task | Full edit | Status only | Delete |
|---------------------------|-----------|-------------|--------|
| Assignee or collaborator | Yes | — | No |
| **Reporter** (creator / `assigner`) | **Yes** | — | **Yes (own tasks only)** |
| Visible but none of above | No | Yes | No |

Admin/Manager: full edit + delete on visible tasks (unchanged).

### Create / assign behavior

| Actor | Create project task | Create subtask | Assignee picker | Assign admin/manager on team |
|--------|---------------------|----------------|----------------|------------------------------|
| Org Admin | Yes | Yes | Project team when project selected | Yes, immediate |
| Org Manager | Yes | Yes | Project team when project selected | Yes, immediate |
| Member on project team | Yes (pending approval) | Yes if assignee on parent | Project team only | Yes, pending approval |
| Member (parent assignee only) | No | Yes on parent | Parent project team | Yes, pending approval |
| Member (reporter only) | — | No | — | Full edit + delete own created tasks |

### Sync checklist — backend (`task/controllers/task.js`)

- [ ] `userIsTaskAssigneeOrCollaborator(task, userId)`
- [ ] **`userIsTaskReporter(task, userId)`** — `assignerPkFromEntity(task) === userId`
- [ ] `memberMayCreateTask` — project team OR subtask on assigned parent; inherit parent `projects` when omitted
- [ ] `assertAssigneesOnProjectTeams` — return `400` if assignee not on project team (not `403`)
- [ ] `resolveProjectIdsFromProjectsInput` — resolve `documentId` + numeric ids
- [ ] `clampSubtaskToSingleAssignee` — subtasks max one assignee
- [ ] **`update`**: Member full edit if `userIsTaskAssigneeOrCollaborator` **OR** `userIsTaskReporter`; else whitelist `MEMBER_TASK_UPDATE_FIELDS` (`status` only)
- [ ] **`delete`**: require `write` (not `manage`); non-admin view gate via `userMayViewTask`; Member delete only if `userIsTaskReporter`; populate `assigner` on delete fetch
- [ ] `buildTaskPopulateConfig`: deep-populate `projects.projectManager` (not `projects: true`)
- [ ] On **create**: auto-set `data.assigner = ctx.state.user.id` when unset

### Sync checklist — PM frontend (`pmOrgRoles.js`)

Add or align these exports:

```javascript
getPmOrgRoleKind()
canCreateProjectsInPm(project)
canEditProjectInPm(project, userId)
canToggleProjectPrivacy()
isProjectTeamMember(project, userId)
canCreateTaskInProject(project, userId)
canApproveTaskAssignmentsInPm()
isTaskAssigneeOrCollaborator(task, userId)
isTaskReporter(task, userId)          // assignerId / assigner.id
canEditTaskInPm(task, userId)        // admin/manager OR assignee/collaborator/reporter
canDeleteTaskInPm(task, userId)      // admin/manager OR reporter (member)
canCreateSubtaskOnTask(task, userId) // admin/manager OR parent assignee/collaborator
```

### Sync checklist — PM UI gates

Replace `isPmMember` / `memberScopedTasks` blocking **all** edits with per-row checks:

| Surface | Use |
|---------|-----|
| Status/priority/assignee disabled | `!canEditTaskInPm(row, currentUserId)` |
| Edit menu / pencil | `canEditTaskInPm(row, currentUserId)` |
| Delete menu / trash | `canDeleteTaskInPm(row, currentUserId)` |
| Add subtask | `canCreateSubtaskOnTask(row, currentUserId)` |
| Promote subtask | `getPmOrgRoleKind() !== 'member'` (keep as-is) |

**Files to update in source repo (find equivalents in target):**

- `apps/pm/app/my-tasks/page.js`
- `apps/pm/app/projects/[slug]/page.js`
- `apps/pm/app/tasks/[id]/page.js`
- `apps/pm/components/ProjectTasksPanel.jsx`
- `apps/pm/components/TaskSubtasksTableExtras.jsx`
- `apps/pm/components/TaskDetailsCard.jsx` — prop `canEdit` (not `isPmMember`)

### Assignee picker (`QuickCreateTaskModal.jsx`)

- [ ] Props: `assigneePickerScopedToProject`, `requiresAssignmentApproval`, `assigneeUsers`
- [ ] When project selected: list **project team only** (PM + `teamMembers`)
- [ ] Pass `requiresAssignmentApproval={memberScopedTasks}` from project detail / My Tasks
- [ ] Member assignments → pending approval flow (existing `approve-assignment` / `reject-assignment` routes)

---

## 3. Reporter label & Project Manager display

### UI label rename (display only)

| Old label | New label |
|-----------|-----------|
| Assigner / ASSIGNER | Reporter / REPORTER |

**Keep** Strapi + JS fields: `assigner`, `assignerId`, `assignerName`.

**Files with label changes:** `QuickCreateTaskModal`, `TaskDetailsCard`, `my-tasks/page.js`, `ProjectTasksPanel`, `TaskSubtasksTableExtras`, `tasks/[id]/page.js`, `tableSortColumns.js`.

### Project Manager on tasks

- [ ] **`taskService.js`**: all list/detail queries include `'populate[projects][populate][projectManager]': '*'`
- [ ] **`dataTransformers.js` `transformTask`**: add `projectManager`, `projectManagerId`, `projectManagerName` from first linked project; subtasks inherit
- [ ] **`taskListUtils.js`** (new file): `enrichTaskWithProjectManager`, `enrichTasksWithProjectManager`
- [ ] **UI**: Task Details Card row; task detail activity sidebar; subtasks table **PROJECT MANAGER** column

---

## 4. Subtasks & major-task lists

### New file: `apps/pm/lib/taskListUtils.js`

| Export | Purpose |
|--------|---------|
| `filterMajorTasks(tasks)` | Drop subtasks whose parent is in the same list |
| `isMajorTask(task, tasks)` | Top-level row check |
| `buildChildrenByParentId(tasks, { excludeTaskIds })` | Inline expand map |
| `enrichTaskWithProjectManager(task, projects)` | Backfill PM from projects list |
| `enrichTasksWithProjectManager(tasks, projects)` | Batch enrich |

### Promote subtask → major task

- [ ] `taskService.promoteSubtaskToMajorTask(id)` → `updateTask(id, { parentId: null })`
- [ ] UI: **Make major task** action + confirm modal (admin/manager only)
- [ ] Surfaces: My Tasks, Project Tasks panel, task detail header + subtask row actions

### Single assignee on subtasks

- [ ] Backend `clampSubtaskToSingleAssignee` on create/update when `parent` set
- [ ] Subtask table: column **ASSIGNEE** (singular), `TaskAssigneesPicker` with `maxAssignees={1}`

### Dashboard / My Tasks counts

- [ ] `app/page.js` dashboard stats: use `filterMajorTasks` for KPIs
- [ ] My Tasks: KPIs/tabs use major tasks; **My Tasks** tab still shows assigned subtasks as own rows

---

## 5. File mapping (webfudge-platform → target suite)

Use this table to locate equivalents. Path prefixes may differ (`apps/pm` vs `xtrawrkx-pm-dashboard` vs `packages/pm`).

### Backend

| Webfudge path | What to port |
|---------------|--------------|
| `apps/backend/src/api/project/content-types/project/schema.json` | `isPrivate` field |
| `apps/backend/src/utils/rbac.js` | Privacy + list/view helpers |
| `apps/backend/src/api/project/controllers/project.js` | List/detail/summary filters |
| `apps/backend/src/api/task/controllers/task.js` | Full permission refactor + reporter gates |
| `apps/backend/types/generated/contentTypes.d.ts` | Regenerate if used |

### PM frontend — lib

| Webfudge path | What to port |
|---------------|--------------|
| `apps/pm/lib/pmOrgRoles.js` | All permission helpers incl. `isTaskReporter` |
| `apps/pm/lib/taskListUtils.js` | **New file** — copy entire module |
| `apps/pm/lib/api/dataTransformers.js` | `isPrivate` on project; PM fields on task |
| `apps/pm/lib/api/taskService.js` | PM populate, `promoteSubtaskToMajorTask` |
| `apps/pm/lib/tableSortColumns.js` | Reporter column label |

### PM frontend — pages

| Webfudge path | What to port |
|---------------|--------------|
| `apps/pm/app/page.js` | Major-task dashboard stats |
| `apps/pm/app/my-tasks/page.js` | Permissions, promote, Reporter, enrich |
| `apps/pm/app/projects/page.js` | Lock icon |
| `apps/pm/app/projects/add/page.js` | Private checkbox |
| `apps/pm/app/projects/[slug]/edit/page.js` | Private checkbox |
| `apps/pm/app/projects/[slug]/page.js` | `displayTasks`, subtask permissions |
| `apps/pm/app/tasks/[id]/page.js` | Full permission model, PM column, promote |

### PM frontend — components

| Webfudge path | What to port |
|---------------|--------------|
| `apps/pm/components/ProjectDetailMetaBar.jsx` | Private badge |
| `apps/pm/components/ProjectTasksPanel.jsx` | `canEditTaskInPm` gates, promote modal |
| `apps/pm/components/QuickCreateTaskModal.jsx` | Scoped picker props |
| `apps/pm/components/TaskAssigneesPicker.jsx` | `maxAssignees` support |
| `apps/pm/components/TaskDetailsCard.jsx` | Reporter label, PM row, `canEdit` |
| `apps/pm/components/TaskSubtasksTableExtras.jsx` | Reporter, promote, permission gates |

---

## 6. API / schema contract (for non-Webfudge backends)

If the target suite talks to the same Strapi API, ensure:

| Item | Detail |
|------|--------|
| **Project field** | `isPrivate: boolean` (default false) |
| **Task field** | `assigner` relation (unchanged) — UI calls it Reporter |
| **Task populate** | `populate[projects][populate][projectManager]=*` on list/detail |
| **Member task update** | Full body allowed when user is assignee, collaborator, or assigner |
| **Member task delete** | `DELETE /api/tasks/:id` with write permission; only if user is assigner |
| **Assignee validation** | `400` "Assignees must be members of the project team" |
| **Approval routes** | `POST /tasks/:id/approve-assignment`, `reject-assignment` (unchanged) |

No database migration required — `isPrivate` defaults to public.

---

## 7. Deployment order

```
1. Deploy backend (schema + controllers + rbac)
2. Restart Strapi
3. Deploy PM frontend (pmOrgRoles → taskListUtils → services → pages → components)
4. Smoke-test verification below
```

---

## 8. Verification checklist (share with QA)

### Private projects

- [ ] Admin sees Private checkbox on add/edit project
- [ ] Manager **cannot** see private project in list unless on team
- [ ] Manager **can** see all public projects
- [ ] Lock icon + Private badge render correctly

### Member as Reporter (e.g. user "Sanket")

- [ ] Member who is **Reporter** but not assignee can edit status, priority, assignees
- [ ] Edit/Delete actions visible on rows where user is Reporter
- [ ] Member can **delete** only tasks they created (Reporter)
- [ ] Member **cannot** delete tasks where they are only assignee

### Member as assignee

- [ ] Full edit on assigned tasks
- [ ] Cannot delete unless also Reporter

### Assignment

- [ ] Assignee picker shows project team only when project selected
- [ ] Member assigning teammate → pending approval badge
- [ ] Admin/Manager approve/reject works

### Reporter / PM display

- [ ] All tables show **Reporter** not Assigner
- [ ] Project Manager column/row populated on task detail

### Subtasks

- [ ] Subtask limited to one assignee
- [ ] Admin/Manager can **Make major task**
- [ ] Dashboard counts exclude nested subtasks (major tasks only)

---

## 9. Related docs (webfudge-platform)

| Doc | Topic |
|-----|-------|
| [PM_PROJECT_PRIVATE_FLAG.md](./PM_PROJECT_PRIVATE_FLAG.md) | Private project detail |
| [PM_TASK_PERMISSIONS_UPDATE.md](./PM_TASK_PERMISSIONS_UPDATE.md) | Assignee + reporter rules |
| [PM_REPORTER_AND_PROJECT_MANAGER_UPDATE.md](./PM_REPORTER_AND_PROJECT_MANAGER_UPDATE.md) | Label + PM display |
| [PM_ORG_ROLE_SCOPING.md](./PM_ORG_ROLE_SCOPING.md) | Admin / Manager / Member matrix |
| [PM_TASK_ASSIGNMENT_APPROVAL.md](./PM_TASK_ASSIGNMENT_APPROVAL.md) | Pending assignment flow |
| [TASK_SUBTASKS_UPDATE.md](./TASK_SUBTASKS_UPDATE.md) | Subtask hierarchy base |

---

## 10. Changelog

| Date | Change |
|------|--------|
| 5 Jun 2026 | Base release `5a36f712` — privacy, permissions, Reporter, PM display, subtasks |
| 5 Jun 2026 | Follow-up — Member **Reporter** gets full edit + delete on own created tasks (`isTaskReporter`, backend update/delete gates) |

---

_Last updated: 5 Jun 2026 — intended for sync to **greenway-suite** and **xtrawrkx-suite**._

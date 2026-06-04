# PM — Organization role scoping (Admin / Manager / Member)

## Summary

PM row-level rules now align with organization roles from **organization-user → organization-role** (JWT / `X-Organization-Id`), not only the module permission matrix.

- **Admin** (`admin`): unchanged — full project and task CRUD within org RBAC.
- **Manager** (`manager`): **read all projects** in the org; **create** projects; **update/delete** only projects where they are the assigned **project manager** (`project.projectManager`).
- **Member** (any other org role, including the default **Member** template): **only projects** where they are project manager or **team member**; **no project create** or **project settings** edits; **tasks** limited to visibility rules below; **task updates** limited to **status** only; **no task create/delete**.

There is **no** separate “task request / approval” workflow in code (none was implemented).

## Scope

| Area | Notes |
|------|--------|
| `apps/backend/src/utils/rbac.js` | `isPmOrgAdminRole`, `isPmOrgManagerRole`, `isPmOrgMemberRole`, `userCanAccessProjectRow` |
| `apps/backend/src/api/project/controllers/project.js` | Member list filter; manager write/delete gate; member create blocked |
| `apps/backend/src/api/task/controllers/task.js` | Member list filter; member create/delete blocked; member update whitelisted fields |
| `apps/pm/lib/pmOrgRoles.js` | Client helpers: `getPmOrgRoleKind`, `canCreateProjectsInPm`, `canEditProjectInPm` |
| PM UI | Projects list/detail/add/edit, sidebar, dashboard, task detail, `ProjectTasksPanel`, `TaskSubtasksAfterRow` |

## Custom org roles

Non-admin roles whose **code/name are not exactly `manager`** are treated as **Member** for these row-level rules. Adjust `isPmOrgManagerRole` in `rbac.js` if you introduce custom role codes that should behave like managers.

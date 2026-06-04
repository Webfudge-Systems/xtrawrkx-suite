# PM Task Creation & Assignment Approval

## Summary

Project team members (org **Member** role) can create tasks on projects they belong to. When they pick assignees, those assignments stay **pending** until an org **Admin** or **Manager** approves them.

Admins and managers can create tasks as before; assignees apply immediately (no approval).

## Scope

- **Backend**: `apps/backend/src/api/task` — schema fields, create rules, approve/reject routes
- **PM app**: project detail tasks tab, `QuickCreateTaskModal`, `ProjectTasksPanel`, `pmOrgRoles.js`

## Behavior

| Actor | Create task on project | Assignees on create |
|--------|------------------------|---------------------|
| Org Admin / Manager | Yes (any project) | Applied immediately |
| Org Member on project team | Yes | Pending until approved |
| Org Member not on team | No | — |

### Approval

- Pending tasks show **Pending approval** on the assignees column.
- Admin/Manager sees **Approve** / **Reject** on the project Tasks tab.
- **Approve**: moves `pendingCollaborators` → `collaborators` (and primary `assignee`).
- **Reject**: clears pending assignees; status `rejected`.

### API

- `POST /api/tasks/:id/approve-assignment`
- `POST /api/tasks/:id/reject-assignment`

Restart Strapi after schema changes so `pendingCollaborators`, `assignmentApprovalStatus`, and `assignmentRequestedBy` are migrated.

## Usage

1. Add users as **Project assignees** on the project.
2. Member opens project → **Tasks** → **Add Task**, selects assignees, creates.
3. Manager/Admin approves from the task row or refreshes after action.

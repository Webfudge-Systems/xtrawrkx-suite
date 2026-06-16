# Task Status Workflow Update

## Summary

Unified task status labels, dropdown options, and chevron steppers across the **Client Portal**, **PM**, and **CRM**. The same Strapi `status` field now maps to a consistent client-visible pipeline and an expanded internal pipeline for Xtrawrkx staff.

## Scope

| Area | Changes |
|------|---------|
| `packages/utils/src/taskStatusWorkflow.js` | Source of truth: labels, step indices, select options, `taskHadInProgress()` |
| `packages/ui/components/TaskStatusStepper/` | Shared chevron stepper (`variant: client \| internal`) |
| `apps/backend/src/api/task/controllers/task.js` | Share-with-client → prep review; client approve/reject logic |
| `apps/backend/src/utils/client-task-workflow.js` | Stage mapping helpers |
| Client portal | Task list + detail labels; `TaskStatusStepper` on detail page |
| PM | `TaskStatusStepper` above KPI cards on task detail; full status dropdown |
| CRM | Client tasks page + account Tasks tab use shared status options |

## Status model

| Status | Client meaning | Internal meaning |
|--------|----------------|------------------|
| `ASSIGNED` | Client created task | Same |
| `ACCEPTED` | Xtrawrkx accepted | Same |
| `WAITING_FOR_CLIENT` | **Review** (prep, before work) or **Your review** (after work) | **Client review (prep)** or **Client review (final)** |
| `SCHEDULED` | Shown as in-progress step | Scheduled to start |
| `IN_PROGRESS` | Work underway | Same |
| `INTERNAL_REVIEW` / `PENDING_REVIEW` | Shown at client review step when work started | Reporter / internal review |
| `REVISION_REQUIRED` | Client requested changes | Back to in progress |
| `ON_HOLD` / `CANCELLED` / `COMPLETED` | As named | As named |

`WAITING_FOR_CLIENT` is distinguished by `taskHadInProgress()` — checks current status and `stageHistory`.

## Pipelines

**Client portal (6 steps):** Assigned → Accepted → Review → In progress → Your review → Completed

**PM / CRM internal (8 steps):** Assigned → Accepted → Client review → Scheduled → In progress → Internal review → Client review → Completed

## Backend behavior

- **First share with client** (before active work): sets `WAITING_FOR_CLIENT` for prep review.
- **Client approve (prep):** → `IN_PROGRESS`
- **Client approve (final):** → `COMPLETED`
- **Client reject / request revision:** → `REVISION_REQUIRED`
- **Reporter internal review:** set `INTERNAL_REVIEW` or `PENDING_REVIEW`, then `COMPLETED`, `WAITING_FOR_CLIENT`, or `IN_PROGRESS` via status dropdown.

## Usage

```jsx
import { TaskStatusStepper } from '@webfudge/ui';
import { getTaskStatusLabel, TASK_STATUS_SELECT_OPTIONS } from '@webfudge/utils';

// Client portal detail
<TaskStatusStepper status={task.strapiStatus} variant="client" task={task} />

// PM task detail (above KPI cards)
<TaskStatusStepper status={task.strapiStatus} variant="internal" task={task} />

// Context-aware label
getTaskStatusLabel(status, { variant: 'client', task });
```

## Client workflow panel (PM)

The **Client workflow** card on PM task detail now uses the same internal 8-step chevron as the page header:

Assigned → Accepted → Client review → Scheduled → In progress → Internal review → Client review → Completed

- **Update status** dropdown replaces the old "Advance stage" control
- **Request client action** sets `WAITING_FOR_CLIENT` (prep or final based on progress)
- Legacy `clientWorkflowStage` values (`CLIENT_SUBMITTED`, `CLIENT_DECISION`, etc.) are mapped automatically for existing tasks


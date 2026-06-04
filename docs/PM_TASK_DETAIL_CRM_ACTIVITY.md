# PM Task Detail — CRM Activity & Comments

## Summary

The PM task detail route (`/tasks/[id]`) is aligned with the project detail page: KPI row, glass-style header actions, overview layout with status pill and description section. **Comments** and **Activity** tabs load real CRM data via `taskActivityService` and shared **`EntityActivityPanel`**.

## Scope

- **`packages/ui`**: `EntityActivityPanel` accepts **`defaultSubTab`** (`'activity' | 'chat'`), optional **`className`**, and **`minHeightPx` / `maxHeightPx`** for layout control.
- **`apps/pm`**: `apps/pm/app/tasks/[id]/page.js` — timeline state, tab badges from API totals, **`fetchTaskActivityTimeline`** + **`fetchTaskComments`** for counts; **`addTaskComment`** after posting refreshes the timeline.

## Details

- Tab badges: **Comments** uses comment-thread **`meta.total`**; **Activity** uses full timeline **`meta.total`** (same reload helper loads both).
- **Overview** tab: full-width **Discussion** block below the task + record grid — same **`EntityActivityPanel`** as **Comments** (Chats first), so chat is available without leaving Overview.
- **Comments** tab: panel opens on **Chats** (`defaultSubTab="chat"`).
- **Activity** tab: left **Activity summary** card + panel on **Activity** (`defaultSubTab="activity"`).
- Backend task create/update/delete logs to **`crm-activity`** with `subjectType: 'task'` (see Strapi task controller and `crm-activity-log.js`).

## Usage / Migration

No migration steps. Ensure Strapi exposes **`/crm-activities/timeline`** and **`/crm-activities/comments`** with **`taskId`** query/body as implemented in the `crm-activity` controller.

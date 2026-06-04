# PM Projects Table — Comments & Owner Column

## Summary

The PM **Projects** list table now matches **My Tasks** and **Lead companies** for row comments: a **Comments** control appears on row hover (always visible when the project has comments), opening the same anchored composer pattern as other PM/CRM tables. The **Owner** column uses the same **avatar + truncated name** presentation as the **Assigner** column on My Tasks, with a compact dropdown to change owner instead of a full-width `Select`.

The CRM activity API already supported project comments; batch **comment counts** for the current page are loaded via a new query parameter on the existing `comment-counts` endpoint.

## Scope

- **Backend:** `apps/backend/src/api/crm-activity/controllers/crm-activity.js` — `GET /crm-activities/comment-counts?projectIds=1,2,3` (same response shape as `taskIds`).
- **PM API:** `apps/pm/lib/api/projectActivityService.js` — `fetchProjectCommentCounts`.
- **PM UI:** `apps/pm/app/projects/page.js` — comment UI, owner cell, imports.

## Usage

- **Comments:** Hover a project row → click the speech icon beside the project name. Posting uses `POST /crm-activities/comments` with `projectId` (unchanged).
- **Counts:** The page requests counts for all project IDs on the current list page after each load.
- **Owner:** Click the owner cell (avatar + name) to open the list; choose **Unassigned** or a user. Updates still go through `projectService.updateProject` with `projectManager`.

## Migration

None. Older clients that do not call `projectIds` are unaffected.

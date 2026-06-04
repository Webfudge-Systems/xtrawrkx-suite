# PM Projects list — table columns update

## Summary

The Projects list view (table) column picker now matches **My Tasks** / **lead-companies** behavior: more optional fields, **drag-to-reorder** with an orange drop indicator, and **Reset to default** restoring both visibility and column order.

## Scope

- **App:** `apps/pm`
- **File:** `apps/pm/app/projects/page.js`

## Details

### Optional columns (toggle + reorder)

In addition to Status, Progress %, Owner, and Due date, users can show:

- Start date  
- Tasks (done / total) — from `transformProject` (`completedTasks` / `totalTasks`; list API already populates task `status`)  
- Team size — `teamMembers` / `team` length  
- Client — `clientName`  
- Budget — numeric `budget` (locale-formatted)  
- Description — truncated  
- Created / Last updated — `createdAt` / `updatedAt` via `TableCellCreated`

**Project name** and **Actions** stay fixed at the ends of the table; only the middle columns respect order and visibility.

### Persistence

- **Visibility:** `localStorage` key `pm.projects.tableColumnVisibility` (merged with defaults on load).  
- **Order:** `pm.projects.tableColumnOrder` (array of column keys; unknown keys dropped, missing keys appended).

### Defaults

The same four columns as before default to **on** (Status, Progress %, Owner, Due date). New fields default **off**. Default order follows the definition list in `TOGGLEABLE_COLUMNS`.

## Usage

Open the **eye** control on the Projects toolbar (list view), toggle checkboxes, drag the **grip** to reorder, or use **Reset to default**.

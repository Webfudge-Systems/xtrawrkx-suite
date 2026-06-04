# Task recurrence (PM)

## Summary

Tasks can repeat **daily**, **weekly** (optional weekdays + interval), **monthly**, or **custom** (interval + day/week/month). Settings are stored on the Strapi `task` content type. When a recurring task is marked **Completed**, the backend creates the **next occurrence** (same name, description, assignee, projects, collaborators, CRM links, and recurrence rule) with computed **start** and **due** dates.

## Scope

- **Backend**: `schema.json` recurrence attributes; `utils/task-recurrence.js` (`computeNextOccurrence`, `ensureRecurrenceGroupId`); `task` controller `create`/`update` (group id + spawn on complete).
- **PM**: `TaskRecurrenceFormFields.jsx`, `QuickCreateTaskModal`, task detail inline edit + overview, `dataTransformers` (`recurrenceSummary`), optional subtitle hint on My Tasks / project tasks tables.

## Behavior notes

- **Repeat until** (`recurrenceEndsAt`): next occurrence is skipped if its due date would be after this timestamp (end of selected calendar day in the browser when saving).
- **Weekly / weekdays**: next due date is the first matching weekday **after** the current due date; **Every N weeks** adds extra weeks when weekdays are used (`interval > 1`).
- **Monthly**: optional **day of month** (1–31); otherwise the day-of-month from the anchor due/start date is used; clamps to last valid day of month.
- **Series**: `recurrenceGroupId` links instances (assigned on first recurring save).

Restart Strapi after schema changes so the database receives new columns.

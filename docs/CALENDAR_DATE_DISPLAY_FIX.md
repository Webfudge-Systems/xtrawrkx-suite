# Calendar date display fix

## Summary

Start dates, due dates, and other date-only fields were stored as midnight UTC (`YYYY-MM-DD` → `…T00:00:00.000Z`). Browsers interpreted that as a precise timestamp, so tables showed misleading relative text (for example **“17 hours ago”** on a start date that should read **“yesterday”**).

## Scope

- **`@webfudge/utils`**: new `formatters/calendarDate.js` (parse, format, day-based relative labels, overdue helper).
- **`@webfudge/ui`**: `crmTableFormat.js` and `TableCellCreated` use calendar-aware formatting; optional `dateMode="calendar"`.
- **PM**: My Tasks, project tasks, subtasks, projects list, dashboard widgets, transformers.
- **CRM**: client tasks list (scheduled date column + overdue/today filters).

## Details

- Calendar values are parsed in the **local** calendar (noon anchor avoids DST edge cases).
- Relative subtitles use **whole days** (`today`, `tomorrow`, `yesterday`, `in 2 days`, `3 days ago`).
- `createdAt` / `updatedAt` still use hour/minute relative formatting.
- Overdue checks compare **local calendar days**, so a task is not overdue until the day after its due date.

## Usage

```jsx
<TableCellCreated dateString={task.dueDate} dateMode="calendar" />
```

`dateMode="auto"` detects date-only and midnight-UTC values automatically.

Import calendar helpers from the **main** `@webfudge/utils` entry (not `@webfudge/utils/formatters/calendarDate`) so Next.js/webpack resolve them in all apps.

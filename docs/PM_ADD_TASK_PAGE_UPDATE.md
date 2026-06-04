# PM Add Task — modal + legacy route

## Summary
Creating a task is done in a **modal on `/my-tasks`** (no full-page flow). The old route **`/my-tasks/add`** is kept as a **server redirect** to `/my-tasks?createTask=1` (optional `&status=` preserved) so bookmarks and old links still work.

## Scope
- **Create / edit UI:** `apps/pm/app/my-tasks/page.js` — `Modal` with title, optional subtitle, footer actions (`rounded-lg` buttons via `@webfudge/ui`).
- **Suspense:** `apps/pm/app/my-tasks/layout.js` — wraps the segment for `useSearchParams` usage.
- **Legacy redirect:** `apps/pm/app/my-tasks/add/page.js` — `redirect()` to `/my-tasks?createTask=1`.
- **Sidebar:** `apps/pm/components/PMSidebar.jsx` — Quick Action “New Task” → `/my-tasks?createTask=1`.
- **Modal package:** `packages/ui/components/Modal/Modal.jsx` — optional **`subtitle`** prop.

## Behavior
- **New Task** (toolbar, empty state, sidebar) opens the create modal; default **status** follows the selected tab (same rules as before).
- **`?createTask=1`** on `/my-tasks` opens the create modal once and then **`router.replace('/my-tasks')`** cleans the URL.
- **`/my-tasks/add?status=…`** redirects to **`/my-tasks?createTask=1&status=…`**.

## UI Notes
- Create flow uses header **“Create New Task”** + subtitle **“Add a new task to your project”**, **Basic information** row with orange icon tile, and a **gray footer bar** for Cancel / Create Task.

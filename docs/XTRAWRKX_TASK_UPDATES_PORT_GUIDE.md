# Task Updates — Port Guide for `xtrawrkx-suite` / Cursor

> **Audience:** `xtrawrkx-suite`, `greenway-suite`, or any fork mirroring Webfudge PM + Strapi backend.  
> **Purpose:** Single doc to copy into the target repo and paste into **Cursor** to implement the same task-list fixes from `webfudge-platform`.  
> **Source repo:** `webfudge-platform` on `master`  
> **Commits covered (last 3):**

| Commit | Message |
|--------|---------|
| `a1a4458` | Refactor task fetching and enhance task management features |
| `0aa2483` | Add backfill scripts and enhance task management features |
| `5a85bd0` | Fix stale task lists: skip Redis cache for tasks, paginate across PM/CRM/Books |

**Related (older, still required if not shipped):** `c5585a3` Reporter permissions, `5a36f71` project privacy — see [`PM_LAST_COMMIT_UPDATE_SUMMARY.md`](./PM_LAST_COMMIT_UPDATE_SUMMARY.md) for those.

---

## Summary — what these 3 commits fix

| Symptom | Root cause | Fix |
|---------|------------|-----|
| **All Tasks** shows ~10 rows; DB has 30+ | Redis cached partial `GET /api/tasks` pages with wrong `meta.pagination.total` | Skip Redis cache for all task GETs; flush legacy keys after deploy |
| Task count jumps up after create, then drops | Reload replaced state with stale/partial API page | `mergeTasksById` + `loadTasks({ mergeWithPrevious: true })` after save |
| Members missing tasks they created | List `$or` omitted `{ assigner: uid }` | Backend visibility + assigner backfill script |
| Calendar / CRM dashboards miss tasks | Single-page fetch (`pageSize=500` only) | Shared `paginateStrapiList` across apps |
| Duplicate/stale loads in React | Strict mode double-fetch race | `loadTasksRequestIdRef` guard on My Tasks |

---

## How to use this doc

1. Copy **`docs/XTRAWRKX_TASK_UPDATES_PORT_GUIDE.md`** into the target repo (same path recommended).
2. Open **Cursor** in the target repo.
3. Paste the **Cursor prompt** below (§1).
4. Port in order: **Backend → shared utils → PM → CRM/Books (if present) → deploy → verify**.

---

## 1. Cursor prompt (copy-paste)

```
Read docs/XTRAWRKX_TASK_UPDATES_PORT_GUIDE.md (this file).

Port the last 3 webfudge-platform task updates into this repo:

COMMITS (reference):
- a1a4458 — task pagination fetchAllTasks*, filterMajorTasks, My Tasks / dashboard / project pages
- 0aa2483 — assigner visibility in task find, backfill scripts, assigner stream in fetchPMTasksByAssignee
- 5a85bd0 — Redis skip for /api/tasks*, paginateStrapiList in @webfudge/utils, CRM/Books fetchAll, Cache-Control no-store

BACKEND (Strapi):
1. task/controllers/task.js — find $or includes { assigner: uid }; userMayViewTask checks reporter; create sets assigner; Cache-Control no-store on find/findOne/myWork
2. middlewares/api-cache.js — never cache GET /api/tasks*; always invalidate org cache on task writes (POST /api/tasks too)
3. utils/content-api-helpers.js — readListQuery reads nested query.pagination.pageSize
4. scripts: backfill-task-assigners.js, flush-api-cache.js (loads .env), prod-task-audit.js (optional)
5. package.json scripts: backfill:task-assigners, flush:api-cache

SHARED:
6. packages/utils/src/api/paginateStrapiList.js — export paginateStrapiList, listCacheBust from @webfudge/utils

PM FRONTEND:
7. lib/taskListUtils.js — mergeTasksById, filterMajorTasks, enrichTasksWithProjectManager
8. lib/api/taskService.js — fetchAllTasks, fetchAllTasksByProject, fetchPMTasksByAssignee (assignee+collab+assigner streams), uses paginateStrapiList
9. app/my-tasks/page.js — fetchAllTasks, mergeWithPrevious on save, loadTasksRequestIdRef race guard, TABLE_PAGE_SIZE=12
10. app/page.js, app/projects/[slug]/page.js, components/ProjectTasksPanel.jsx — fetchAll* + merge on save
11. lib/loadWorkspaceCalendar.js — paginate task queries

CRM (if this repo has CRM):
12. lib/api/taskService.js — fetchAll() using paginateStrapiList
13. clients/tasks page, DashboardMyTasksWidget, dashboardDataService, teamPerformanceService, loadWorkspaceCalendar — use fetchAll / paginateStrapiList

BOOKS (if present):
14. lib/api.ts — tasksApi.listAll + fetchTimeEntries uses paginated fetch

Match existing code style. Map paths by responsibility (apps/pm may be packages/pm or xtrawrkx-pm-dashboard). Backend before frontend. List files changed when done.
```

---

## 2. Port order

```
Backend (Strapi)
  → packages/utils (paginateStrapiList)
  → PM frontend
  → CRM / Books (if in repo)
  → restart local API
  → production: deploy backend → flush Redis → deploy frontends
```

---

## 3. File mapping (webfudge-platform → target repo)

Match by **responsibility**, not exact folder names.

| webfudge-platform | Typical xtrawrkx / fork equivalent |
|-------------------|-------------------------------------|
| `apps/backend/src/api/task/controllers/task.js` | Same path under Strapi app |
| `apps/backend/src/middlewares/api-cache.js` | Same |
| `apps/backend/src/utils/content-api-helpers.js` | Same |
| `apps/backend/scripts/backfill-task-assigners.js` | Same |
| `apps/backend/scripts/flush-api-cache.js` | Same |
| `packages/utils/src/api/paginateStrapiList.js` | Shared utils package |
| `apps/pm/lib/api/taskService.js` | PM app task API client |
| `apps/pm/lib/taskListUtils.js` | PM task list helpers |
| `apps/pm/app/my-tasks/page.js` | My Tasks page |
| `apps/pm/app/page.js` | PM dashboard |
| `apps/pm/app/projects/[slug]/page.js` | Project detail |
| `apps/pm/components/ProjectTasksPanel.jsx` | Project tasks tab |
| `apps/pm/lib/loadWorkspaceCalendar.js` | Calendar data loader |
| `apps/crm/lib/api/taskService.js` | CRM task client |
| `apps/books/lib/api.ts` | Books API client |

---

## 4. Backend changes (commit-by-commit)

### 4.1 `a1a4458` — Pagination & list queries

**`content-api-helpers.js` — `readListQuery`**

Koa nests `pagination[pageSize]=500` as `query.pagination.pageSize`. Must read both:

```javascript
const pag = query.pagination && typeof query.pagination === 'object' ? query.pagination : null;
const pageSize = Math.min(
  parseInt(
    query['pagination[pageSize]'] || pag?.pageSize || query.pageSize || String(defaultPageSize),
    10
  ),
  maxPageSize
);
```

**`task.js` — `find`**

- Set `ctx.set('Cache-Control', 'no-store')` before return.
- Keep `maxPageSize: 500` in `readListQuery` opts.

---

### 4.2 `0aa2483` — Reporter visibility & backfill

**`task.js` — visibility (non-admin PM scope)**

```javascript
const visOr = [
  { assigner: uid },           // ← ADD: Reporter / creator sees own tasks
  { assignee: uid },
  { collaborators: { id: uid } },
];
if (pids.length) visOr.push({ projects: { id: { $in: pids } } });
```

**`userMayViewTask`**

- Populate `assigner: true`.
- Return true when user is task reporter (`assignerPkFromEntity(entry) === userId`).

**`create`**

- Default `data.assigner = ctx.state.user.id` when unset.
- Mirror legacy: if assigner still unset but assignee set, use assignee as assigner.

**`fetchPMTasksByAssignee` (PM frontend)**

Add third paginated stream with `stream: 'assigner'` (filter `filters[assigner][id][$eq]=userId`).

**Scripts (`apps/backend/package.json`)**

```json
"backfill:task-assigners": "node scripts/backfill-task-assigners.js",
"backfill:task-assigners:dry-run": "node scripts/backfill-task-assigners.js --dry-run",
"flush:api-cache": "node scripts/flush-api-cache.js"
```

**Production SQL backfill** (if assigner links missing):

```sql
INSERT INTO tasks_assigner_lnk (task_id, user_id)
SELECT t.id, asg.user_id
FROM tasks t
JOIN tasks_assignee_lnk asg ON asg.task_id = t.id
LEFT JOIN tasks_assigner_lnk asn ON asn.task_id = t.id
WHERE asn.task_id IS NULL AND asg.user_id IS NOT NULL;
```

Table is **`tasks_assigner_lnk`**, not `tasks_assignee_lnk`.

---

### 4.3 `5a85bd0` — Redis cache rules & cross-app pagination

**`api-cache.js` — critical rules**

```javascript
function isTaskApiPath(path) {
  return path === '/api/tasks' || path.startsWith('/api/tasks/');
}

// GET: skip cache for ALL task paths (list, detail, my-work)
function shouldSkipGetCache(path) {
  if (shouldSkipMutationInvalidate(path)) return true;
  if (isTaskApiPath(path)) return true;
  return false;
}

// POST /api/tasks MUST invalidate org cache (old code skipped because path matched skip list)
```

**`task.js`**

- `Cache-Control: no-store` on `findOne` and `myWork` responses too.

**`packages/utils/src/api/paginateStrapiList.js`**

Copy entire file. Export from utils `index.js`:

```javascript
export { listCacheBust, strapiRowId, paginateStrapiList } from './api/paginateStrapiList';
```

**Logic summary:** walk pages until empty batch; only trust `meta.pagination.total` when last page is short (`batch.length < pageSize`); if full page returned, keep paging even when stale total says done.

---

## 5. PM frontend changes

### 5.1 `lib/taskListUtils.js`

Ensure these exports exist:

| Export | Purpose |
|--------|---------|
| `filterMajorTasks` | Tab badges / All Tasks count (root tasks only) |
| `mergeTasksById` | Merge API reload with existing state after create |
| `isMajorTask` | Table row filtering |
| `enrichTasksWithProjectManager` | PM column when API omits nested populate |

### 5.2 `lib/api/taskService.js`

Replace single-page list loads with:

| Method | Used by |
|--------|---------|
| `fetchAllTasks(options)` | My Tasks, dashboard KPIs |
| `fetchAllTasksByProject(projectId, options)` | Project detail Tasks tab |
| `fetchPMTasksByAssignee(userId, options)` | Dashboard “My tasks” widget (3 streams) |

Implementation wraps `paginateStrapiList` (or local `paginateTaskApi` delegating to it). Pass `cacheBust` via `_=` query param on each page request.

### 5.3 `app/my-tasks/page.js`

```javascript
const TABLE_PAGE_SIZE = 12;
const loadTasksRequestIdRef = useRef(0);

const loadTasks = useCallback(async ({ silent = false, mergeWithPrevious = false } = {}) => {
  const requestId = ++loadTasksRequestIdRef.current;
  const rawList = await taskService.fetchAllTasks({ pageSize: 500, sort: 'updatedAt:desc', ...filters });
  if (requestId !== loadTasksRequestIdRef.current) return;
  const list = rawList.map(transformTask).filter(Boolean);
  setAllTasks(mergeWithPrevious ? mergeTasksById(list, prev) : list);
}, [...]);

// After create/update:
await loadTasks({ silent: true, mergeWithPrevious: true });
```

Tab badge counts use `filterMajorTasks(allTasksEnriched).length` for **All Tasks** total.

### 5.4 Other PM pages

| File | Change |
|------|--------|
| `app/page.js` | `taskService.fetchAllTasks` + `fetchPMTasksByAssignee` |
| `app/projects/[slug]/page.js` | `fetchAllTasksByProject`; `loadTasks({ mergeWithPrevious: true })` on save |
| `components/ProjectTasksPanel.jsx` | Same merge pattern on task save |
| `lib/loadWorkspaceCalendar.js` | `paginateStrapiList` for both task date-range and recurring queries |

---

## 6. CRM & Books (if in target repo)

### CRM

**`lib/api/taskService.js`** — add `fetchAll()`:

```javascript
import { listCacheBust, paginateStrapiList } from '@webfudge/utils';

async function fetchAll(params = {}) {
  const rows = await paginateStrapiList(
    (page, ps, cacheBust) => strapiClient.get(ENDPOINT, buildListQuery({ ...params, 'pagination[page]': page, 'pagination[pageSize]': ps, _: cacheBust })),
    { pageSize: 500, cacheBust: listCacheBust(params) }
  );
  return { data: filterCrmTasks(rows), meta: { pagination: { total: rows.length } } };
}
```

Replace `taskService.getAll` with `fetchAll` in:

- `app/clients/tasks/page.js`
- `components/dashboard/DashboardMyTasksWidget.jsx`
- `lib/api/dashboardDataService.js` — replace naive `fetchAllPaged` loop with `paginateStrapiList`
- `lib/api/teamPerformanceService.js` — same
- `lib/loadWorkspaceCalendar.js` — `taskService.fetchAll` ×2

### Books

**`lib/api.ts`**

```typescript
import { listCacheBust, paginateStrapiList } from '@webfudge/utils'

// tasksApi.listAll — paginated
// booksApi.fetchTimeEntries → tasksApi.listAll
```

---

## 7. Ops — after production deploy

```bash
cd apps/backend

# 1. Deploy backend to Railway / host first

# 2. Flush stale cached task pages (once)
npm run flush:api-cache
npm run flush:api-cache -- --org 1

# 3. Optional: backfill missing reporters (production Postgres only)
npm run backfill:task-assigners:dry-run
npm run backfill:task-assigners

# 4. Deploy PM (+ CRM/Books) frontends

# 5. Verify My Tasks → All Tasks count matches DB major-task count
npm run audit:prod-tasks -- 1   # optional; needs DATABASE_URL
```

`flush-api-cache.js` auto-loads `REDIS_URL` from `apps/backend/.env` when not set in shell.

---

## 8. Verification checklist

### Backend

- [ ] `GET /api/tasks` response has `Cache-Control: no-store`
- [ ] `GET /api/tasks` does **not** return `X-Cache: HIT` (when Redis enabled)
- [ ] `POST /api/tasks` returns `X-Cache-Invalidate` > 0 on mutation
- [ ] Non-admin member who **created** a task sees it in `find` results

### PM

- [ ] **All Tasks** tab count ≈ major tasks in DB (not stuck at ~10)
- [ ] Create task → count increases and **stays** after ~30s (no drop)
- [ ] Table shows **page 2** when >12 rows (`TABLE_PAGE_SIZE = 12`)
- [ ] Hard refresh still shows full list

### CRM / Books (if ported)

- [ ] CRM clients/tasks page loads full list
- [ ] Calendar shows tasks beyond first API page
- [ ] Books time entries / utilization metrics include all tasks

---

## 9. Diff reference (files touched in source repo)

```
apps/backend/package.json
apps/backend/scripts/backfill-task-assigners.js
apps/backend/scripts/flush-api-cache.js
apps/backend/scripts/prod-task-audit.js
apps/backend/scripts/debug-task-find-count.js
apps/backend/src/api/task/controllers/task.js
apps/backend/src/middlewares/api-cache.js
apps/backend/src/utils/content-api-helpers.js
packages/utils/src/api/paginateStrapiList.js
packages/utils/src/index.js
apps/pm/lib/api/taskService.js
apps/pm/lib/taskListUtils.js
apps/pm/lib/loadWorkspaceCalendar.js
apps/pm/app/my-tasks/page.js
apps/pm/app/page.js
apps/pm/app/projects/[slug]/page.js
apps/pm/components/ProjectTasksPanel.jsx
apps/crm/lib/api/taskService.js
apps/crm/lib/api/dashboardDataService.js
apps/crm/lib/api/teamPerformanceService.js
apps/crm/lib/loadWorkspaceCalendar.js
apps/crm/app/clients/tasks/page.js
apps/crm/components/dashboard/DashboardMyTasksWidget.jsx
apps/books/lib/api.ts
docs/TASK_LIST_CACHE_FIX.md
docs/REDIS_CACHE.md
```

To inspect exact diffs in source repo:

```bash
git show a1a4458 --stat
git show 0aa2483 --stat
git show 5a85bd0 --stat
git diff a1a4458^..5a85bd0 -- apps/backend apps/pm packages/utils
```

---

## 10. Related docs in webfudge-platform

| Doc | Contents |
|-----|----------|
| [`TASK_LIST_CACHE_FIX.md`](./TASK_LIST_CACHE_FIX.md) | Cache rules + pagination summary |
| [`PM_LAST_COMMIT_UPDATE_SUMMARY.md`](./PM_LAST_COMMIT_UPDATE_SUMMARY.md) | Full PM port guide (privacy, reporter, permissions — older commits) |
| [`REDIS_CACHE.md`](./REDIS_CACHE.md) | Redis env vars and invalidation |

---

*Generated from `webfudge-platform` commits `a1a4458`, `0aa2483`, `5a85bd0` — share this file with xtrawrkx Cursor as the implementation spec.*

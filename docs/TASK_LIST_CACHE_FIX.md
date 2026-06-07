# Task List Updates (Cache + Pagination)

## Summary

Full port of `webfudge-platform` task-list fixes (commits `a1a4458`, `0aa2483`, `5a85bd0`):

- Redis no longer caches `GET /api/tasks*`; task reads send `Cache-Control: no-store`
- Shared `paginateStrapiList` walks all pages (handles stale `meta.pagination.total`)
- PM, CRM, and Books list views fetch complete task sets; My Tasks merges on save and guards double-fetch races

## Scope

### Backend

- `apps/backend/src/middlewares/api-cache.js` — skip Redis for all task GET paths
- `apps/backend/src/api/task/controllers/task.js` — `Cache-Control: no-store` on `find`, `findOne`, `myWork`
- `apps/backend/src/utils/content-api-helpers.js` — `readListQuery` reads nested `query.pagination.pageSize`
- `apps/backend/scripts/flush-api-cache.js` — one-time flush of legacy cached keys
- `apps/backend/package.json` — `flush:api-cache` script

### Shared

- `packages/utils/src/api/paginateStrapiList.js` — `paginateStrapiList`, `listCacheBust`, `strapiRowId`

### PM

- `apps/pm/lib/api/taskService.js` — `fetchAllTasks*` uses shared pagination + cache bust
- `apps/pm/lib/loadWorkspaceCalendar.js` — paginated task queries
- `apps/pm/app/my-tasks/page.js` — `loadTasksRequestIdRef` race guard

### CRM

- `apps/crm/lib/api/taskService.js` — `fetchAll()` with `scope=crm`
- `apps/crm/lib/loadWorkspaceCalendar.js` — uses `taskService.fetchAll`
- `apps/crm/lib/api/dashboardDataService.js`, `teamPerformanceService.js` — `paginateStrapiList` for paged fetches
- `apps/crm/app/clients/tasks/page.js`, `DashboardMyTasksWidget.jsx` — `fetchAll`

### Books

- `apps/books/lib/api.ts` — `tasksApi.listAll`; `booksApi.fetchTimeEntries` uses full pagination

## Behavior

| Request | Before | After |
|---------|--------|-------|
| `GET /api/tasks` | Cached in Redis (stale `meta.pagination.total`) | Never cached; `Cache-Control: no-store` |
| `GET /api/tasks/:id` | Cached | Never cached; `Cache-Control: no-store` |
| `GET /api/tasks/my-work` | Cached | Never cached; `Cache-Control: no-store` |
| `POST /api/tasks` | Org cache invalidation | Unchanged (still invalidates org cache) |

## Production deploy

```bash
cd apps/backend

# 1. Deploy backend first

# 2. Flush stale keys once (all orgs or one org)
npm run flush:api-cache
npm run flush:api-cache -- --org 1

# 3. Deploy PM, CRM, Books frontends
```

`flush-api-cache.js` loads `REDIS_URL` from `apps/backend/.env` when not set in the shell.

## Verification

- `GET /api/tasks` — response has `Cache-Control: no-store`
- `GET /api/tasks` — no `X-Cache: HIT` when Redis is enabled
- PM My Tasks **All Tasks** count matches DB major-task count after hard refresh
- CRM clients/tasks page and calendar show tasks beyond the first API page

## Related

- PM merge helpers: `apps/pm/lib/taskListUtils.js` (`mergeTasksById`, `filterMajorTasks`)
- CRM scope filter: `docs/CRM_TASK_SCOPE_FILTER.md`
- Redis env and flush: `docs/REDIS_CACHE.md`

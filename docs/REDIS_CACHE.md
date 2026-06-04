# Redis caching (Strapi backend)

## Summary

When `REDIS_URL` is set, the API caches **GET** responses for almost all `/api/*` routes — including CRM/PM “big data” such as contacts, lead companies, deals, tasks, projects, meetings, proposals, invoices, notifications, and related list/detail endpoints. **POST/PUT/PATCH/DELETE** clears that organization’s cache so lists stay fresh.

## Scope

| Layer | File |
|--------|------|
| Redis client | `apps/backend/src/utils/redis.js` |
| Cache helpers | `apps/backend/src/utils/cache.js` |
| API-wide cache | `apps/backend/src/middlewares/api-cache.js` |
| Middleware order | `apps/backend/config/middlewares.js` (after `jwt-auth`) |
| Health | `GET /api/health/redis` |

## What is cached

All authenticated (or public) **GET** requests under `/api/*`, for example:

- `GET /api/contacts` (+ pagination/filters)
- `GET /api/lead-companies`
- `GET /api/deals`
- `GET /api/tasks`
- `GET /api/projects`
- `GET /api/meetings`
- `GET /api/notifications`
- `GET /api/proposals`, `/api/invoices`, `/api/crm-activities`, etc.

Cache keys include **user id**, **organization id**, **org role**, and a hash of **path + query** so tenant isolation and RBAC stay correct.

## What is not cached

| Path / method | Reason |
|---------------|--------|
| `/api/auth/*` | Login/signup must never be cached |
| `/api/health/*` | Ops/diagnostics |
| `/api/upload`, `/admin/*` | Uploads / admin |
| POST, PUT, PATCH, DELETE | Writes; they **invalidate** org cache instead |

## Invalidation

Any successful mutation (`2xx`) on `/api/*` deletes Redis keys matching:

```text
cache:*:o:<organizationId>:*
```

So creating/updating a contact, task, project, etc. refreshes list data on the next GET (after cache miss).

## Response headers

| Header | Meaning |
|--------|---------|
| `X-Cache: HIT` | Served from Redis |
| `X-Cache: MISS` | Loaded from DB, stored in Redis |
| `X-Cache-Invalidate: N` | Mutation cleared `N` keys for the org |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | — | Connection URL (Railway private URL on API service) |
| `REDISHOST` + `REDISPASSWORD` | — | Fallback if URL not set |
| `REDIS_ENABLED` | `true` | Set `false` to disable Redis entirely |
| `CACHE_API_ENABLED` | `true` | Set `false` to keep Redis but skip API response cache |
| `CACHE_TTL_SECONDS` | `300` | TTL for cached GET responses (5 minutes) |
| `CACHE_MAX_BODY_BYTES` | `5242880` | Skip caching responses larger than 5 MB |
| `CACHE_KEY_PREFIX` | `cache` | Redis key prefix |

## Railway setup

1. Link **Redis** to the **API** service (`REDIS_URL` = `redis://default:…@redis.railway.internal:6379`).
2. Deploy backend with this code.
3. Logs: `✅ Redis connected (redis://…)`
4. Use the app (CRM/PM lists), then Redis **Data** → `KEYS cache:*`.

## Verify after deploy

```bash
# Health
curl -s https://api.webfudge.in/api/health/redis

# First load (MISS) — needs Authorization + X-Organization-Id like your apps
curl -s -D - -o /dev/null \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  "https://api.webfudge.in/api/contacts?pagination[page]=1&pagination[pageSize]=25"

# Second identical request should show: X-Cache: HIT
```

## Local test (no redis-cli)

```powershell
cd apps/backend
$env:REDIS_URL = "<Railway public URL>"
npm run test:redis
```

Use the **public** URL locally; `redis.railway.internal` only works inside Railway.

## Security

- Do not commit real `REDIS_URL` values.
- Rotate Redis credentials if exposed.
- Cached payloads are per user + org + role; do not share Redis across untrusted tenants without separate DB indexes.

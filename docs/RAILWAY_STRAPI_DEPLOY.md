# Strapi Backend on Railway

## Summary

When **Postgres shows “Completed”** on Railway but the **API service is “Crashed”** with `KnexTimeoutError: Timeout acquiring a connection`, Postgres is usually fine — Strapi is misconfigured or cannot open connections (wrong client, missing SSL, pool too large, or bad `DATABASE_URL` wiring).

## Scope

- Hosting: [Railway](https://railway.app) (e.g. `api.webfudge.in` / custom domain on API service)
- App: `apps/backend` (Strapi 5)
- Database: Railway Postgres (`postgres-ssl` template)

## Railway checklist

### 1. Service settings (API)

| Setting | Value |
|--------|--------|
| **Root directory** | `apps/backend` (if deploying from monorepo) |
| **Build** | `npm install` (or `npm ci`) |
| **Start** | `npm run start` → `strapi start` |
| **Watch Paths** | `apps/backend/**` (optional, for monorepo) |

### 2. Link Postgres to the API service

In the API service **Variables** tab, reference the Postgres service so Railway injects connection vars:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Prefer the **private** URL when both services are in the same project (lower latency, fewer proxy limits):

```text
DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}
```

### 3. Required variables (API service)

Set these **manually** (Railway does not set `DATABASE_CLIENT` for you):

```bash
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=5
SEED_DATA=false

HOST=0.0.0.0
PORT=${{PORT}}

APP_KEYS=<4 comma-separated keys>
ADMIN_JWT_SECRET=<secret>
API_TOKEN_SALT=<secret>
TRANSFER_TOKEN_SALT=<secret>
JWT_SECRET=<secret>
ENCRYPTION_KEY=<secret>
```

Generate secrets locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Redis (optional caching)

Link the **Redis** service to the API so Railway injects `REDIS_URL` (private URL uses `redis.railway.internal`). After deploy, check API logs for `Redis connected` and:

```bash
curl https://<your-api-domain>/api/health/redis
curl https://<your-api-domain>/api/apps
```

See [REDIS_CACHE.md](./REDIS_CACHE.md).

### 5. Do **not** copy local `.env` to Railway

Local dev uses SQLite and often `SEED_DATA=true`. Production must use **postgres** and **`SEED_DATA=false`**.

### 6. After fixing variables

1. Open **API service → Deployments → View logs** and confirm `strapi start` succeeds.
2. Redeploy **once** (avoid a tight crash loop that holds DB connections).
3. In Postgres **Metrics**, confirm active connections drop after the API stays up.

## Code change (repo)

`apps/backend/config/database.js` now:

- Uses **only** `DATABASE_URL` when present (avoids `host: localhost` conflicting with Railway’s URL).
- Enables SSL when `DATABASE_SSL=true` or the URL looks like Railway / requires SSL.
- Defaults pool to **min 0, max 5** for Postgres (fits small Railway Postgres connection limits).

## Common mistakes

| Symptom | Cause |
|--------|--------|
| Crashed on boot, Knex timeout | `DATABASE_CLIENT` still `sqlite` or unset |
| Crashed on boot | `DATABASE_URL` not linked from Postgres service |
| Crashed on boot | SSL off while using `*.proxy.rlwy.net` public URL |
| Slow crash loop | `SEED_DATA=true` + large bootstrap on every restart |
| Pool full | `DATABASE_POOL_MAX=10` + multiple replicas or restart loop |

## Verify

```bash
curl https://<your-api-domain>/api/apps
```

Admin panel: `https://<your-api-domain>/admin`

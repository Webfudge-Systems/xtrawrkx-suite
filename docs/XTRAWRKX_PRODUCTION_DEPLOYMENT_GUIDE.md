# Xtrawrkx Suite — Complete Production Deployment Guide

## Summary

This guide walks through deploying the **full Xtrawrkx suite** end to end:

1. **Railway** — Strapi API (`apps/backend`), **Postgres**, and **Redis** (API response cache for CRM/PM lists).
2. **Postgres data** — copy live CRM/PM data from the **working production** database (`api.webfudge.in` today).
3. **Vercel** — new Next.js projects for each frontend app (CRM, PM, Accounts, Orbit), pointed at the new API.

Use this as the single checklist for the `xtrawrkx-suite` Railway project and fresh Vercel frontend projects.

---

## Target architecture

```mermaid
flowchart TB
  subgraph Vercel["Vercel (new projects)"]
    CRM[crm.xtrawrkx.com]
    PM[pm.xtrawrkx.com]
    ACC[accounts.xtrawrkx.com]
    ORB[orbit.xtrawrkx.com]
    PORTAL[portal.xtrawrkx.com optional]
  end

  subgraph Railway["Railway — xtrawrkx-suite"]
    API[xtrawrkx_suits Strapi API]
    PG[(Postgres)]
    RD[(Redis)]
  end

  CRM --> API
  PM --> API
  ACC --> API
  ORB --> API
  PORTAL --> API
  API --> PG
  API --> RD
```

| Layer | Host | Repo path |
|-------|------|-----------|
| API | Railway service `xtrawrkx_suits` | `apps/backend` |
| Database | Railway Postgres | — |
| Cache | Railway Redis | linked to API |
| CRM | Vercel | `apps/crm` |
| PM | Vercel | `apps/pm` |
| Accounts | Vercel | `apps/accounts` |
| Orbit (org manager) | Vercel | `apps/organization-manager` |
| Client portal (optional) | Vercel | `apps/xtrawrkx-client-portal` |

**Domain plan (recommended):** use `*.xtrawrkx.com` — already allowed in `apps/backend/config/middlewares.js`. Legacy `*.webfudge.in` URLs in `apps/*/\.env.production` are from the old stack; update Vercel env vars when you cut over.

| Service | Production URL (target) |
|---------|-------------------------|
| API | `https://api.xtrawrkx.com` |
| CRM | `https://crm.xtrawrkx.com` |
| PM | `https://pm.xtrawrkx.com` |
| Accounts | `https://accounts.xtrawrkx.com` |
| Orbit | `https://orbit.xtrawrkx.com` |
| Portal | `https://portal.xtrawrkx.com` |

Until DNS is ready, use Railway/Vercel default URLs (`*.up.railway.app`, `*.vercel.app`) — CORS already allows `https://*.vercel.app`.

---

## Pre-deploy: merge monorepo into `master`

Railway and Vercel deploy from the Git branch you configure (usually **`master`**). The monorepo layout (`apps/backend`, `apps/crm`, `packages/*`, Redis cache, etc.) must be on that branch **before** production deploy.

| Step | Command / action |
|------|------------------|
| 1 | Finish work on `feat/monorepo-setup` (or your feature branch) |
| 2 | Commit all changes (`.env` / `.env.local` stay gitignored) |
| 3 | Optional: `git fetch origin` and merge `origin/master` into your branch if others pushed |
| 4 | `git checkout master` → `git merge feat/monorepo-setup` |
| 5 | `git push origin master` — triggers Railway/Vercel redeploy |

You do **not** need to merge `master` into your branch first if `git rev-list --left-right --count feat/monorepo-setup...origin/master` shows `0` behind. What matters is merging **your branch → `master`**, then push.

---

## Recommended order of operations

Do these in order so you do not point empty frontends at an empty database, or wipe data by redeploying with `SEED_DATA=true`.

| Step | What | Why |
|------|------|-----|
| 0 | **Merge monorepo to `master` and push** | Hosts deploy old repo layout until this is done |
| 1 | Railway: API + Postgres online | Backend must boot before data import |
| 2 | Railway: add **Redis**, link to API | CRM/PM list performance |
| 3 | **Import** working CRM/PM Postgres + uploads | Real tenants, leads, tasks, projects |
| 4 | Custom domain on API + verify `/api/apps` | Frontends need stable API URL |
| 5 | **New Vercel projects** per app | Clean env/build settings per app |
| 6 | Set `NEXT_PUBLIC_*` on Vercel, deploy | Values are baked in at **build** time |
| 7 | DNS for `*.xtrawrkx.com` | User-facing URLs |
| 8 | Smoke test login, org switch, CRM + PM lists | CORS + Redis + RBAC |

---

## Part 1 — Railway backend (API + Postgres)

Detailed troubleshooting: [RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md).

### 1.1 Service layout (your project)

In Railway project **xtrawrkx-suite** / environment **production**:

| Service | Role |
|---------|------|
| `xtrawrkx_suits` | Strapi API (GitHub deploy) |
| `Postgres` | Primary database |
| `Redis` | **Add if missing** — API response cache |

Connect **Postgres → API** and **Redis → API** (Variables tab → “Add reference” / service linking).

### 1.2 API service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/backend` |
| **Build Command** | `npm install` or `npm ci` |
| **Start Command** | `npm run start` |
| **Watch paths** (optional) | `apps/backend/**` |

Node: **≥ 20** (`apps/backend/package.json` engines).

### 1.3 API environment variables

Set on the **API** service (not Postgres):

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=${{PORT}}

# Postgres (link service — prefer private URL)
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=5

# Never seed on every boot in production
SEED_DATA=false

# Strapi secrets — generate NEW for greenfield, or copy EXACTLY from old api.webfudge.in if restoring DB + sessions matter
APP_KEYS=<key1,key2,key3,key4>
ADMIN_JWT_SECRET=<secret>
API_TOKEN_SALT=<secret>
TRANSFER_TOKEN_SALT=<secret>
JWT_SECRET=<secret>
ENCRYPTION_KEY=<secret>

# Optional public URL (admin links, emails)
PUBLIC_URL=https://api.xtrawrkx.com
```

Generate new secrets (one per line):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important:** If you **restore** the old production database, copy `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, etc. from the **old** `api.webfudge.in` environment. New secrets invalidate existing JWTs (users must log in again) but password hashes in Postgres still work.

### 1.4 Do not copy local `.env`

Local dev uses **SQLite** and often `SEED_DATA=true`. Production must use **postgres** and **`SEED_DATA=false`**.

### 1.5 Verify API (before frontends)

```bash
curl -s https://<your-railway-or-custom-api>/api/apps
```

Admin: `https://<api-domain>/admin`

---

## Part 2 — Redis on Railway

Caching is documented in [REDIS_CACHE.md](./REDIS_CACHE.md). Redis is **recommended** for production CRM/PM (contacts, leads, tasks, projects, etc.).

### 2.1 Add Redis

1. Railway project → **+ New** → **Database** → **Redis**.
2. Open **API service → Variables**.
3. Add reference: `REDIS_URL=${{Redis.REDIS_URL}}` (or use Railway’s “Connect” / link UI so the private URL is injected).

Private URL shape (inside Railway):

```text
redis://default:<password>@redis.railway.internal:6379
```

Optional tuning:

```bash
REDIS_ENABLED=true
CACHE_API_ENABLED=true
CACHE_TTL_SECONDS=300
```

### 2.2 Verify Redis

**Deploy logs** should show:

```text
✅ Redis connected (redis://…)
```

**HTTP health:**

```bash
curl -s https://<api-domain>/api/health/redis
```

Expected when connected: `"configured": true`, `"ping": "PONG"`, and a `cacheKeyCount` after using CRM/PM.

**Response headers** (authenticated GET, same URL twice):

| Header | Meaning |
|--------|---------|
| `X-Cache: MISS` | First load from DB |
| `X-Cache: HIT` | Served from Redis |

Mutations return `X-Cache-Invalidate: N` and clear org-scoped keys.

### 2.3 Local Redis test (optional)

Use Railway **Connect → Public URL** (not `redis.railway.internal`):

```powershell
cd apps/backend
$env:REDIS_URL = "redis://default:****@....proxy.rlwy.net:*****"
npm run test:redis
```

---

## Part 3 — Migrate data from working CRM/PM

**Source of truth today:** production Strapi + Postgres behind **`https://api.webfudge.in`** (CRM `crm.webfudge.in`, PM `pm.webfudge.in`). You want that **tenant data** on the new Railway Postgres — not an empty DB from a fresh deploy.

### 3.1 What to migrate

| Asset | Includes |
|-------|----------|
| **Postgres dump** | Organizations, users, roles, leads, contacts, deals, tasks, projects, meetings, proposals, invoices, audit logs, etc. |
| **Upload files** | `apps/backend/public/uploads` on the old server (default Strapi local provider) |
| **Secrets** (optional) | Same Strapi `APP_KEYS` / `JWT_*` if you want existing tokens to work until expiry |

### 3.2 Backup source database

From a machine that can reach **old** production Postgres (Railway/Supabase dashboard → connection string, or SSH to old host):

```bash
# Custom format (recommended — parallel restore, selective)
pg_dump "$OLD_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=xtrawrkx-crm-pm-$(date +%Y%m%d).dump

# Or plain SQL
pg_dump "$OLD_DATABASE_URL" --clean --if-exists -f xtrawrkx-backup.sql
```

Store the dump securely; it contains all customer PII.

### 3.3 Restore into Railway Postgres

**Warning:** This **replaces** the target database. Stop the API service or scale to 0 during restore to avoid Strapi writing mid-restore.

1. Railway → **Postgres** → **Connect** → copy `DATABASE_URL` (or private URL from a one-off Railway shell).
2. Restore:

```bash
# Custom format
pg_restore --clean --if-exists --no-owner --no-acl \
  -d "$NEW_DATABASE_URL" \
  xtrawrkx-crm-pm-YYYYMMDD.dump

# Plain SQL
psql "$NEW_DATABASE_URL" -f xtrawrkx-backup.sql
```

3. If restore errors on extensions/roles, use `--no-owner --no-acl` (as above) or restore schema-only first, then data — adjust for your host’s permissions.

### 3.4 Strapi schema compatibility

- Deploy the **same repo revision** (or newer with backward-compatible migrations) as production before importing.
- On first boot after restore, Strapi may run metadata migrations; watch API logs once.
- Do **not** set `SEED_DATA=true` after restore — it can overwrite bootstrap rows.

### 3.5 Media / uploads

If the old API used **local** uploads:

1. Copy `public/uploads` from the old `apps/backend` deployment to the new Railway volume, **or**
2. Re-deploy after adding a persistent volume mounted at `public/uploads`, **or**
3. Use `rsync` / SFTP from old server into the new container path.

Broken file URLs in CRM/PM usually mean uploads were not copied.

### 3.6 Post-migration checks (API)

```bash
# Public catalog (no auth)
curl -s https://<api-domain>/api/apps

# After logging in via CRM (browser): lists should return data
# Contacts / lead-companies / tasks / projects — not empty arrays for known orgs
```

In Strapi Admin → confirm organization count, users, and sample lead-company / task records.

### 3.7 When **not** to full-restore

| Situation | Approach |
|-----------|----------|
| Greenfield demo only | Empty Postgres + `SEED_DATA=false`; bootstrap creates apps/modules only when DB has no App rows |
| Schema drift between old and new code | Restore to **staging** Postgres first, fix migrations, then repeat for production |
| Partial export | Use Strapi export/import or custom scripts (out of scope here) |

Local wipe + seed (dev only): [LOCAL_DB_RESET.md](./LOCAL_DB_RESET.md).

---

## Part 4 — API custom domain & CORS

1. Railway **API service → Settings → Networking → Custom Domain** → `api.xtrawrkx.com`.
2. DNS: CNAME to Railway’s target.
3. Confirm `apps/backend/config/middlewares.js` includes your frontend origins (already lists `https://crm.xtrawrkx.com`, `https://pm.xtrawrkx.com`, etc., plus `*.vercel.app`).
4. If you add a new subdomain, add it to `allowedOrigins` and redeploy API.

---

## Part 5 — Vercel: new frontend projects

Create **separate Vercel projects** (do not reuse old Webfudge projects if env/root paths differ). Connect the **same GitHub repo** (`xtrawrkx_suits` monorepo).

### 5.1 Monorepo settings (all Next apps)

For each project:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/crm` (or `apps/pm`, `apps/accounts`, `apps/organization-manager`) |
| **Include files outside root** | **Enabled** (required for `packages/*`) |
| **Node.js Version** | 20.x |
| **Install Command** | `cd ../.. && npm ci` |
| **Build Command** | `npm run build` |
| **Output** | Next.js default (`.next`) |

Reference: `apps/organization-manager/vercel.json` uses root install from monorepo.

### 5.2 Suggested Vercel project names

| Vercel project name | Root directory | Production domain |
|-------------------|----------------|-------------------|
| `xtrawrkx-crm` | `apps/crm` | `crm.xtrawrkx.com` |
| `xtrawrkx-pm` | `apps/pm` | `pm.xtrawrkx.com` |
| `xtrawrkx-accounts` | `apps/accounts` | `accounts.xtrawrkx.com` |
| `xtrawrkx-orbit` | `apps/organization-manager` | `orbit.xtrawrkx.com` |
| `xtrawrkx-portal` (optional) | `apps/xtrawrkx-client-portal` | `portal.xtrawrkx.com` |

**Production branch:** `main` (or your release branch).

### 5.3 Environment variables (Production)

Set in **each** Vercel project → **Settings → Environment Variables → Production**. Rebuild after changes (`NEXT_PUBLIC_*` is embedded at build time).

#### CRM (`apps/crm`)

```bash
NEXT_PUBLIC_API_URL=https://api.xtrawrkx.com
NEXT_PUBLIC_CRM_APP_URL=https://crm.xtrawrkx.com
NEXT_PUBLIC_PM_APP_URL=https://pm.xtrawrkx.com
```

#### PM (`apps/pm`)

```bash
NEXT_PUBLIC_API_URL=https://api.xtrawrkx.com
NEXT_PUBLIC_PM_APP_URL=https://pm.xtrawrkx.com
NEXT_PUBLIC_CRM_APP_URL=https://crm.xtrawrkx.com
```

#### Accounts (`apps/accounts`)

```bash
NEXT_PUBLIC_API_URL=https://api.xtrawrkx.com
NEXT_PUBLIC_ACCOUNTS_APP_URL=https://accounts.xtrawrkx.com
NEXT_PUBLIC_CRM_ORIGIN=https://crm.xtrawrkx.com
```

See also: [ACCOUNTS_PRODUCTION_DEPLOY.md](./ACCOUNTS_PRODUCTION_DEPLOY.md).

#### Orbit / Organization Manager (`apps/organization-manager`)

```bash
NEXT_PUBLIC_API_URL=https://api.xtrawrkx.com
NEXT_PUBLIC_ORG_MANAGER_URL=https://orbit.xtrawrkx.com
NEXT_PUBLIC_SITE_URL=https://orbit.xtrawrkx.com
NEXT_PUBLIC_ACCOUNTS_APP_URL=https://accounts.xtrawrkx.com
NEXT_PUBLIC_PM_APP_URL=https://pm.xtrawrkx.com
NEXT_PUBLIC_CRM_APP_URL=https://crm.xtrawrkx.com
```

Platform admin login (after DB restore or seed): [LOCAL_DB_RESET.md](./LOCAL_DB_RESET.md) — `admin@xtrawrkx.com` only applies if that user exists in the restored DB.

### 5.4 Custom domains on Vercel

Per project → **Domains** → add subdomain → follow DNS instructions (CNAME to `cname.vercel-dns.com` or A record as shown).

### 5.5 Build from CLI (sanity check)

```bash
npm install
npm run build:crm
npm run build:pm
npm run build:accounts
npm run build:org-manager
```

---

## Part 6 — End-to-end verification

### Backend

| Check | Command / action |
|-------|------------------|
| API up | `curl -s https://api.xtrawrkx.com/api/apps` |
| Redis | `curl -s https://api.xtrawrkx.com/api/health/redis` |
| Data present | Strapi Admin → organizations, sample CRM/PM entities |
| No seed loop | Logs do not re-run full seed on every restart |

### CRM

| Check | Action |
|-------|--------|
| Login | Existing user from migrated DB |
| Org switch | Header org picker; `X-Organization-Id` sent |
| Lists | Leads, contacts, deals load (check Network → `X-Cache: HIT` on repeat) |
| Cross-link | Link to PM opens `NEXT_PUBLIC_PM_APP_URL` |

### PM

| Check | Action |
|-------|--------|
| Login | Same user / org |
| Projects & tasks | Lists match pre-migration data |
| Kanban / tables | No CORS errors in console |

### Accounts

| Check | Action |
|-------|--------|
| Users / roles | `/users` loads for admin |
| Audit logs | “Open in CRM” uses `NEXT_PUBLIC_CRM_ORIGIN` |

### Orbit

| Check | Action |
|-------|--------|
| Platform login | `/login` with platform admin user |
| Organizations | List matches migrated tenants |

### Common failures

| Symptom | Fix |
|---------|-----|
| CORS error in browser | Add exact frontend origin to `middlewares.js`; redeploy API |
| Empty CRM/PM after “successful” deploy | Postgres restore skipped or wrong `DATABASE_URL` |
| `KnexTimeoutError` on API boot | [RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md) — `DATABASE_CLIENT`, SSL, pool |
| API works, FE shows wrong API | Rebuild Vercel after fixing `NEXT_PUBLIC_API_URL` |
| Lists slow but no `X-Cache` | Redis not linked; check `/api/health/redis` |
| 401 after DB restore | Expected if JWT secrets changed — users re-login |
| Broken images | Copy `public/uploads` from old API |

---

## Part 7 — Cutover checklist (webfudge.in → xtrawrkx.com)

1. Lower TTL on DNS records 24–48h before cutover.
2. Complete Parts 1–6 on **xtrawrkx** URLs; smoke test with team.
3. Point `api.xtrawrkx.com`, `crm.xtrawrkx.com`, `pm.xtrawrkx.com`, etc.
4. Optionally redirect old `*.webfudge.in` → new hosts (Vercel/Railway redirects or DNS).
5. Update `apps/crm/.env.production`, `apps/pm/.env.production`, `apps/accounts/.env.production` in repo to match production URLs for future builds.
6. Monitor Railway metrics (Postgres connections, Redis memory) for 48h.

---

## Related documentation

| Doc | Topic |
|-----|--------|
| [RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md) | Postgres SSL, pool, crash fixes |
| [REDIS_CACHE.md](./REDIS_CACHE.md) | Cache behavior, env vars, health |
| [ACCOUNTS_PRODUCTION_DEPLOY.md](./ACCOUNTS_PRODUCTION_DEPLOY.md) | Accounts-specific deploy |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | All env variable reference |
| [LOCAL_DB_RESET.md](./LOCAL_DB_RESET.md) | Dev-only DB wipe + platform admin |
| [BACKEND_CORS_ORG_HEADER_UPDATE.md](./BACKEND_CORS_ORG_HEADER_UPDATE.md) | `X-Organization-Id` / CORS |

---

## Quick reference — production URLs

Update this table when domains are final:

| Component | URL |
|-----------|-----|
| API (Railway) | `https://api.xtrawrkx.com` or `https://xtrawrkxsuits-production.up.railway.app` |
| CRM (Vercel) | `https://crm.xtrawrkx.com` |
| PM (Vercel) | `https://pm.xtrawrkx.com` |
| Accounts (Vercel) | `https://accounts.xtrawrkx.com` |
| Orbit (Vercel) | `https://orbit.xtrawrkx.com` |
| Legacy source API (migration) | `https://api.webfudge.in` |

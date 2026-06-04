# Xtrawrkx API (Strapi)

Strapi **5** backend for the Xtrawrkx suite: CRM, PM, Accounts, auth, multi-tenant organizations, and content APIs.

**Production:** Railway project `xtrawrkx-suite` · **Root directory:** `apps/backend`

---

## Quick start (local)

```bash
# From monorepo root
npm install
cp apps/backend/.env.example apps/backend/.env.local
cp apps/backend/.env.local apps/backend/.env
npm run dev:backend
```

- API: http://localhost:1337  
- Admin: http://localhost:1337/admin  

Default dev DB is **SQLite** (`.tmp/data.db`). Use PostgreSQL in production.

Reset local DB:

```bash
npm run reset:db
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run develop` / `dev` | Dev with auto-reload |
| `npm run start` | Production (no reload) |
| `npm run build` | Build admin panel |
| `npm run test:redis` | Redis connectivity test |

---

## Production (Railway)

Required variables (see `apps/backend/.env.example`):

```bash
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=5
SEED_DATA=false
# APP_KEYS, JWT_SECRET, ADMIN_JWT_SECRET, …
```

Link **Redis** for API caching → `REDIS_URL`.

**Deploy guide:** [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)  
**Troubleshooting:** [docs/RAILWAY_STRAPI_DEPLOY.md](../../docs/RAILWAY_STRAPI_DEPLOY.md) · [docs/REDIS_CACHE.md](../../docs/REDIS_CACHE.md)

---

## Layout

```
apps/backend/
├── config/           # database, middlewares (CORS), plugins
├── src/api/          # Content-types & controllers
├── database/seeds/   # Apps/modules, platform admin
├── public/uploads/   # Media (copy on DB migration)
└── scripts/          # reset-local-db, test-redis
```

---

## Learn more

- [Strapi documentation](https://docs.strapi.io)

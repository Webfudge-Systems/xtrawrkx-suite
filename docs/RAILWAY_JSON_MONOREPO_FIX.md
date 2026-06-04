# Railway `railway.json` — monorepo fix

## Summary

After moving Strapi from `xtrawrkx-backend-strapi/` to `apps/backend/`, Railway deploys failed at **Snapshot** with:

```text
service config at 'railway.json' not found
```

## Fix

### 1. Repo

Added **`apps/backend/railway.json`** with build/start and health check on `/api/apps`.

### 2. Railway dashboard (`xtrawrkx_suits` service)

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/backend` |
| **Railway config file** | `/apps/backend/railway.json` |

The config file path is **from the repository root**, not relative to Root Directory ([Railway monorepo docs](https://docs.railway.com/deployments/monorepo)).

### 3. Redeploy

Push to `master`, or **Deployments → Redeploy**.

## Scope

- `apps/backend/railway.json`
- [RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md)
- [WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md) Phase 2

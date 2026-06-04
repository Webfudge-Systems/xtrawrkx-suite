# Railway `railway.json` — monorepo fix

## Summary

After moving Strapi to `apps/backend/`, deploys failed at **Snapshot** with:

```text
service config at 'railway.json' not found
```

Railway resolves the config file path **from the repository root**, not from **Root Directory** (`apps/backend`).

## Fix (Railway dashboard)

Open service **`xtrawrkx_suits`** → **Settings**:

| Setting | Required value |
|---------|----------------|
| **Root Directory** | `apps/backend` |
| **Railway config file** | **`/apps/backend/railway.json`** |

Do **not** use bare `railway.json` unless you rely on the duplicate at repo root (see below).

Click Railway’s **Fix config file path** button if offered — it should set `/apps/backend/railway.json`.

Then **Redeploy**.

## Fix (repository)

| File | Purpose |
|------|---------|
| **`apps/backend/railway.json`** | Source of truth (Strapi build/start) |
| **`railway.json`** (repo root) | Fallback when dashboard path is still `railway.json` — keep in sync with `apps/backend/railway.json` |

When updating build/start commands, edit **`apps/backend/railway.json`** and copy the same JSON to root **`railway.json`**, or change the dashboard path to `/apps/backend/railway.json` only and delete the root copy later.

## Why both paths?

| Dashboard config path | File Railway looks for |
|----------------------|-------------------------|
| `railway.json` | `/railway.json` at repo root only |
| `/apps/backend/railway.json` | `apps/backend/railway.json` |

Bare `railway.json` does **not** resolve to `apps/backend/railway.json` automatically.

## Config contents

```json
{
  "build": {
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/apps"
  }
}
```

## Related

- [RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md)
- [WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md) Phase 2

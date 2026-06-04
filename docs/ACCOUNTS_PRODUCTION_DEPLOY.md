# Accounts App — Production Deploy

## Summary

Deploy **Webfudge Accounts** (`apps/accounts`) as a Next.js 14 app that talks to Strapi at **`https://api.webfudge.in`**. Browser builds embed **`NEXT_PUBLIC_*`** variables at **build time**, so set them in CI/hosting before `next build`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Strapi base URL, e.g. `https://api.webfudge.in` |
| `NEXT_PUBLIC_ACCOUNTS_APP_URL` | Yes | Canonical URL of Accounts (metadata, OG). Matches backend CORS: **`https://accounts.webfudge.in`** |
| `NEXT_PUBLIC_CRM_ORIGIN` | Recommended prod | CRM origin for Audit Logs “Open in CRM”, e.g. `https://crm.webfudge.in` |
| `NEXT_PUBLIC_TRIAL_DAYS_REMAINING` | No | Sidebar trial badge; UI defaults to 12 if unset |

Repo file **`apps/accounts/.env.production`** mirrors CRM/PM with production URLs. For **Vercel/hosting dashboards**, duplicate these as project env vars (same names).

### API layer (`lib/`)

- **`lib/strapiClient.js`** is the only HTTP entry point for the backend. It reads **`NEXT_PUBLIC_API_URL`** with the same fallback order as **`@webfudge/auth`** (`packages/auth`) and CRM (`apps/crm/lib/strapiClient.js`).
- All **`lib/api/*.js`** modules (`usersService`, `rolesService`, `organizationService`, `auditService`, etc.) import **`strapiClient`** only — no duplicate base URLs or raw `fetch` to Strapi elsewhere.

Login and session flows use **`authService`** from **`@webfudge/auth`**, which also uses **`NEXT_PUBLIC_API_URL`**, so **one env var** wires both auth and data calls to production.

## Build

From repository root (installs workspace deps once):

```bash
npm install
npx turbo run build --filter=@webfudge/accounts
```

Or only Accounts:

```bash
cd apps/accounts && npm install && npm run build
```

Output: **`apps/accounts/.next`**.

## Run (Node server)

```bash
cd apps/accounts && npm run start
```

Default listen port is **3003** (`package.json`). Behind nginx, proxy `https://accounts.webfudge.in` → `http://127.0.0.1:3003`.

## Backend checklist

- Strapi **`config/middlewares.js`** already allows origin **`https://accounts.webfudge.in`** for CORS.
- Same JWT / org header behavior as CRM: **`Authorization`** + **`X-Organization-Id`** from the auth package.

## Hosting notes

- **Vercel**: Root directory `apps/accounts`, install command `npm install` from monorepo root or configure workspace install; set env vars; build command `npm run build` with root `turbo` or app-only build as above.
- **VM + PM2**: Build on server or CI, rsync `.next` + `node_modules` + `package.json`, run `npm run start` or `node_modules/.bin/next start -p 3003`.

## Scope

- App: `apps/accounts`
- Related: `packages/auth`, `packages/ui`, Strapi `apps/backend`

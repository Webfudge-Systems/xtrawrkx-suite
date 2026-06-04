# Xtrawrkx CRM

Sales workspace: leads, contacts, deals, clients, proposals, meetings, and dashboards.

**Package:** `@xtrawrkx/crm` · **Port:** 3001 · **API:** Strapi via `@webfudge/auth`

---

## Quick start

```bash
# Monorepo root
cp apps/crm/.env.example apps/crm/.env.local
npm run dev:backend
npm run dev:crm
```

http://localhost:3001

---

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_CRM_APP_URL=http://localhost:3001
NEXT_PUBLIC_PM_APP_URL=http://localhost:3005
```

Production examples: `apps/crm/.env.production`

---

## Deploy

Vercel · root `apps/crm` · [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)

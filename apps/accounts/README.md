# Xtrawrkx Accounts

Organization admin: users, roles, departments, teams, billing, security, audit logs, and app access.

**Package:** `@xtrawrkx/accounts` · **Port:** 3003 · **API:** Strapi via `@webfudge/auth`

---

## Quick start

```bash
cp apps/accounts/.env.example apps/accounts/.env.local
npm run dev:backend
npm run dev:accounts
```

http://localhost:3003

---

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_ACCOUNTS_APP_URL=http://localhost:3003
NEXT_PUBLIC_CRM_ORIGIN=http://localhost:3001
```

---

## Deploy

Vercel · root `apps/accounts` · [docs/ACCOUNTS_PRODUCTION_DEPLOY.md](../../docs/ACCOUNTS_PRODUCTION_DEPLOY.md) · [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)

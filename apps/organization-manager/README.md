# Xtrawrkx Orbit (Organization Manager)

Platform super-admin app: create and manage tenant organizations, licenses, and links into Accounts / PM.

**Package:** `@xtrawrkx/organization-manager` · **Port:** 3004

---

## Quick start

```bash
cp apps/organization-manager/.env.example apps/organization-manager/.env.local
npm run dev:backend
npm run dev:org-manager
```

http://localhost:3004

Platform admin (after local DB seed): see [docs/LOCAL_DB_RESET.md](../../docs/LOCAL_DB_RESET.md).

---

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_ORG_MANAGER_URL=http://localhost:3004
NEXT_PUBLIC_ACCOUNTS_APP_URL=http://localhost:3003
NEXT_PUBLIC_PM_APP_URL=http://localhost:3005
NEXT_PUBLIC_CRM_APP_URL=http://localhost:3001
```

---

## Deploy

Vercel · root `apps/organization-manager` · [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)

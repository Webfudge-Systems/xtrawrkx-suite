# Xtrawrkx PM

Project management: projects, tasks, Kanban, calendar, inbox, and delivery views aligned with CRM.

**Package:** `@xtrawrkx/pm` · **Port:** 3005 · **API:** Strapi via `@webfudge/auth`

---

## Quick start

```bash
cp apps/pm/.env.example apps/pm/.env.local
npm run dev:backend
npm run dev:pm
```

http://localhost:3005

---

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_PM_APP_URL=http://localhost:3005
NEXT_PUBLIC_CRM_APP_URL=http://localhost:3001
```

---

## Deploy

Vercel · root `apps/pm` · [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)

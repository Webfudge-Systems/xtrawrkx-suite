# Xtrawrkx Landing

Public marketing site: events, communities, resources, services, contact, and `/admin` CMS routes.

**Package:** `@xtrawrkx/landing` · **Port:** 3000 · **Production:** Vercel (`apps/landing`)

---

## Quick start

From monorepo root:

```bash
npm install
cp apps/landing/.env.example apps/landing/.env.local
npm run dev:landing
```

Open http://localhost:3000

Or from this directory:

```bash
npm run dev
```

---

## Environment

```bash
cp .env.example .env.local
```

Key variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_STRAPI_API_URL` | Strapi API (e.g. `http://localhost:1337/api`) |
| `NEXT_PUBLIC_BASE_URL` | Site URL for sitemap / emails |
| `NEXT_PUBLIC_CLOUDINARY_*` | Image uploads |
| `NEXT_PUBLIC_FIREBASE_*` | Legacy/CMS data (optional) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Who can access `/admin` |
| `EMAIL_USER` / `EMAIL_PASS` | Contact form — [docs/LANDING_CONTACT_FORM.md](../../docs/LANDING_CONTACT_FORM.md) |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run test` | Vitest |

---

## Structure

```
apps/landing/
├── app/
│   ├── (primary)/    # Public pages
│   ├── (admin)/      # Admin CMS
│   └── (statics)/    # Privacy, terms
├── src/
│   ├── components/
│   ├── services/
│   └── data/
├── public/
└── vercel.json       # Monorepo install from repo root
```

---

## Deploy

Vercel project root: **`apps/landing`** · Team: **Webfudge Systems**

See [docs/LANDING_MONOREPO_UPDATE.md](../../docs/LANDING_MONOREPO_UPDATE.md) and [docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](../../docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md).

---

## Tech

- Next.js 15 · Tailwind 4 · Firebase · Cloudinary · Strapi JWT for admin

More detail: [DOCUMENTATION.md](./DOCUMENTATION.md)

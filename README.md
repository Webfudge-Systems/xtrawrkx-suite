# Xtrawrkx Suite

**The operating system for modern businesses** — monorepo by [Webfudge Systems](https://webfudgesystems.in).

CRM, project management, accounts, marketing site, and shared packages on one **Strapi API** and **npm workspaces** stack.

**Repository:** [github.com/Webfudge-Systems/xtrawrkx-suite](https://github.com/Webfudge-Systems/xtrawrkx-suite)

---

## About Webfudge Systems

**Webfudge Systems** builds connected business software instead of scattered SaaS tools:

- **CRM & sales** — leads, contacts, deals, proposals, invoices
- **Project management** — projects, tasks, timelines, delivery
- **Accounts** — organizations, users, roles, billing, audit
- **Finance (Books)** — sales, purchases, accounting UI
- **Platform admin (Orbit)** — tenant organizations and onboarding
- **Marketing (Landing)** — public site, events, communities

**Website:** [webfudgesystems.in](https://webfudgesystems.in)  
**Contact:** [webfudgesystems@gmail.com](mailto:webfudgesystems@gmail.com)

---

## Apps

| App | Path | Package | Port | Hosting |
| --- | --- | --- | ---: | --- |
| Landing | `apps/landing` | `@xtrawrkx/landing` | 3000 | Vercel |
| CRM | `apps/crm` | `@xtrawrkx/crm` | 3001 | Vercel |
| Client portal | `apps/xtrawrkx-client-portal` | `client-portal` | 3002 | Vercel |
| Accounts | `apps/accounts` | `@xtrawrkx/accounts` | 3003 | Vercel |
| Orbit (org manager) | `apps/organization-manager` | `@xtrawrkx/organization-manager` | 3004 | Vercel |
| PM | `apps/pm` | `@xtrawrkx/pm` | 3005 | Vercel |
| Books | `apps/books` | `@xtrawrkx/books` | 3008 | Vercel |
| **API** | `apps/backend` | `backend` | 1337 | Railway |

Shared: `@webfudge/ui`, `@webfudge/auth`, `@webfudge/utils`, `@webfudge/config`.

---

## Repository structure

```
xtrawrkx-suite/
├── apps/
│   ├── landing/                 # Marketing site (xtrawrkx.com)
│   ├── crm/
│   ├── pm/
│   ├── accounts/
│   ├── organization-manager/  # Orbit — platform super-admin
│   ├── books/
│   ├── xtrawrkx-client-portal/
│   ├── backend/                 # Strapi 5 API
│   └── linkedin-extension/      # Browser extension (optional)
├── packages/
│   ├── ui/
│   ├── auth/
│   ├── config/
│   ├── utils/
│   └── hooks/
└── docs/
```

**Tooling:** Turborepo + npm workspaces (`packageManager: npm@10.2.5`).

---

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14–15 (App Router), React, Tailwind CSS |
| UI | `@webfudge/ui` |
| Backend | Strapi 5, REST, JWT, multi-tenant org headers |
| Data | SQLite (local dev) / PostgreSQL (production) |
| Cache | Redis (optional, API response cache) |
| Monorepo | Turborepo, npm workspaces |

---

## Getting started

### Prerequisites

- Node.js **>= 18** (backend recommends **20.x**)
- npm **>= 9**

### Install

```bash
git clone https://github.com/Webfudge-Systems/xtrawrkx-suite.git
cd xtrawrkx-suite
npm install
```

### Development

All frontends (excludes backend by default):

```bash
npm run dev
```

Individual apps:

```bash
npm run dev:backend      # Strapi → http://localhost:1337/admin
npm run dev:landing      # http://localhost:3000
npm run dev:crm          # http://localhost:3001
npm run dev:pm           # http://localhost:3005
npm run dev:accounts     # http://localhost:3003
npm run dev:org-manager  # http://localhost:3004
npm run dev:books
npm run dev:client-portal
```

Reset local SQLite DB (dev only):

```bash
npm run reset:db
```

### Environment

Copy examples per app:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/crm/.env.example apps/crm/.env.local
cp apps/pm/.env.example apps/pm/.env.local
cp apps/accounts/.env.example apps/accounts/.env.local
cp apps/landing/.env.example apps/landing/.env.local
cp apps/organization-manager/.env.example apps/organization-manager/.env.local
```

See **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)**.

### Build

```bash
npm run build
npm run build:crm
npm run build:landing
# … see package.json for other filters
```

---

## Deployment

Production deploy:

| Doc | Purpose |
|-----|---------|
| **[WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./docs/WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)** | Full checklist (GitHub, Railway, Vercel, Postgres, Redis) |
| **[ENV_FILES.md](./docs/ENV_FILES.md)** | `.env.example` / `.env.local` / `.env.production` per app |
| **[XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md](./docs/XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md)** | One-page quick reference |

Repo: `https://github.com/Webfudge-Systems/xtrawrkx-suite` · API: `xtrawrkxsuits-production.up.railway.app` · Accounts: `accounts.xtrawrkx.com` · Orbit: `orbit.10x1.webfudge.in`

---

## Root scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev for workspace frontends |
| `npm run dev:backend` | Strapi develop |
| `npm run dev:landing` / `dev:crm` / … | Single app |
| `npm run build` | Production build (turbo) |
| `npm run reset:db` | Wipe local SQLite + re-seed |
| `npm run lint` | Lint monorepo |
| `npm run format` | Prettier |

---

## Documentation

| Doc | Purpose |
| --- | --- |
| **[docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)** | Full index |
| **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** | Onboarding |
| **[docs/INSTALLATION.md](./docs/INSTALLATION.md)** | Install & troubleshooting |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | System design |
| **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)** | Environment variables |

Per-app READMEs: `apps/landing/README.md`, `apps/backend/README.md`, `apps/crm/README.md`, etc.

---

## Authentication

JWT auth via **Strapi** (`apps/backend`). Workspace apps use **`@webfudge/auth`** and send **`X-Organization-Id`** for tenant scoping.

---

## License & use

Internal Webfudge Systems codebase. Contact the team before external use or distribution.

---

Built by **Webfudge Systems**.

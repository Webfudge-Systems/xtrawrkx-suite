# Webfudge Platform

**The operating system for modern businesses** — built by [Webfudge Systems](https://webfudgesystems.in).

Webfudge Systems builds custom software and productized business tools: CRM, project management, finance, automation, ERP-style workflows, and admin panels. This monorepo is the shared codebase for that platform—multiple Next.js apps, one Strapi API, and reusable packages used across products.

---

## About Webfudge Systems

**Webfudge Systems** is a software company focused on helping businesses run on fewer, better-connected tools instead of a patchwork of disconnected apps.

We design and ship:

- **CRM & sales** — leads, contacts, deals, proposals, invoices, pipelines
- **Project management** — projects, tasks, timelines, team workload
- **Accounts & billing** — organizations, users, roles, subscriptions
- **Finance (Books)** — sales, purchases, accounting workflows
- **Custom solutions** — dashboards, ERP-style modules, automation, and industry-specific apps (e.g. automobile / VLM)

**Vision:** A future where operations, data, and teams live on one central platform—not scattered across dozens of SaaS logins.

**Mission:** Build a flexible business operating system that lets companies manage workflows, data, and teams through one integrated, modular stack.

**Website:** [webfudgesystems.in](https://webfudgesystems.in)  
**Contact:** [webfudgesystems@gmail.com](mailto:webfudgesystems@gmail.com)

---

## Platform products (apps)

| App | Package | Default port | Role |
| --- | --- | ---: | --- |
| Landing | `apps/landing` | 3000 | Marketing site, signup, product pages |
| CRM | `apps/crm` | 3001 | Sales, leads, deals, clients, proposals |
| PM | `apps/pm` | 3002 | Projects, tasks, delivery |
| Accounts | `apps/accounts` | 3003 | Orgs, users, billing, RBAC |
| Vendor | `apps/vendor` | 3004 | Vendor / license oversight |
| Books | `apps/books` | 3005 | Finance & accounting UI |
| Backend | `apps/backend` | 1337 | Strapi CMS & REST API |
| VLM (automobile) | `apps/(automobile)/vlm` | — | Vehicle / warranty vertical |

All frontends share **`@webfudge/ui`**, **`@webfudge/auth`**, and the same Tailwind preset; the backend is the single source of truth for content and auth.

---

## Repository structure

Monorepo: **Turborepo** + **npm workspaces**.

```
webfudge-platform/
├── apps/
│   ├── landing/              # Public site (webfudgesystems.in)
│   ├── crm/                  # CRM workspace
│   ├── pm/                   # Project management
│   ├── accounts/             # Account & org admin
│   ├── vendor/               # Vendor portal
│   ├── books/                # Finance / Books
│   ├── backend/              # Strapi API
│   └── (automobile)/vlm/     # Vertical: vehicle lifecycle
├── packages/
│   ├── ui/                   # Shared components (tables, charts, layout)
│   ├── auth/                 # Auth provider & helpers
│   ├── billing/              # Billing utilities
│   ├── config/               # Tailwind preset, brand tokens
│   ├── hooks/                # Shared React hooks
│   └── utils/                # Shared utilities
├── docs/                     # Architecture, features, change logs
└── tooling/                  # ESLint, Prettier, TS config
```

---

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| UI | `@webfudge/ui` component library |
| Backend | Strapi 4, REST API, JWT auth |
| Data | SQLite (dev) / PostgreSQL (production) |
| Tooling | Turborepo, npm workspaces, ESLint, Prettier |

---

## Getting started

### Prerequisites

- Node.js **>= 18**
- npm **>= 9**

### Install

```bash
npm install
```

### Development

Run the whole workspace (excluding backend and automobile apps by default):

```bash
npm run dev
```

Run individual products:

```bash
npm run dev:crm
npm run dev:pm
npm run dev:books
npm run dev:backend
```

Or from an app directory:

```bash
cd apps/crm && npm run dev
cd apps/backend && npm run develop
```

Strapi admin: `http://localhost:1337/admin`

### Build & production

```bash
npm run build          # all apps
npm run build:accounts # single app filter examples in package.json
npm run start          # production (per turbo config)
```

### Environment

Each app has its own `.env.example`. Copy and fill before running:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/crm/.env.example apps/crm/.env
cp apps/pm/.env.example apps/pm/.env
# … same pattern for landing, accounts, books, vendor
```

See **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)** for variable details.

### Root scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev mode for frontends (turbo filters) |
| `npm run build` | Production build for all apps |
| `npm run lint` | Lint across the monorepo |
| `npm run format` | Prettier on TS/JS/MD/JSON |
| `npm run clean` | Remove build artifacts & `node_modules` |

---

## Shared packages

- **`@webfudge/ui`** — Buttons, tables, dashboard charts, layout shells, feedback loaders
- **`@webfudge/auth`** — Session/org context for workspace apps
- **`@webfudge/billing`** — Subscription and billing helpers
- **`@webfudge/config`** — Brand colors and Tailwind preset
- **`@webfudge/utils`** — Calendar, formatting, API helpers
- **`@webfudge/hooks`** — Shared React hooks

Import example:

```js
import { Button, LoadingSpinner } from '@webfudge/ui'
import { useAuth } from '@webfudge/auth'
```

---

## Documentation

Technical docs live under **`docs/`**:

| Doc | Purpose |
| --- | --- |
| **[docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)** | Full index of guides and change summaries |
| **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** | Onboarding and learning path |
| **[docs/INSTALLATION.md](./docs/INSTALLATION.md)** | Detailed install & troubleshooting |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | System design and diagrams |
| **[docs/COMMANDS.md](./docs/COMMANDS.md)** | Command reference |
| **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)** | Environment variables |

Feature-specific notes (CRM dashboards, PM tasks, Books UI, shared component refactors, etc.) are also listed in the documentation index.

---

## Authentication

JWT-based auth is issued and validated through **Strapi** (`apps/backend`). Workspace apps use **`@webfudge/auth`** for client-side session and organization context.

---

## Contributing & license

Internal Webfudge Systems codebase. Contribution and license terms are defined by the organization—contact the team before external use or distribution.

---

## Support

- **Email:** [webfudgesystems@gmail.com](mailto:webfudgesystems@gmail.com)
- **Site:** [https://webfudgesystems.in](https://webfudgesystems.in)

---

Built with care by **Webfudge Systems**.

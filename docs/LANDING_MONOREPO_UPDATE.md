# Landing app — monorepo integration

## Summary

The Xtrawrkx marketing site (formerly the standalone **`client`** package) lives at **`apps/landing`** as workspace package **`@xtrawrkx/landing`**, aligned with CRM, PM, and Accounts.

## Scope

- `apps/landing/` — full Next.js 15 app (events, communities, contact, admin CMS routes)
- Root `package.json` — `dev:landing`, `build:landing`
- `apps/landing/vercel.json` — monorepo install from repo root
- `apps/landing/.env.example` — env template

## Package rename

| Before | After |
|--------|--------|
| `name: "client"` | `name: "@xtrawrkx/landing"` |
| `cd client && npm install` | `npm run dev:landing` from repo root |

## Usage

```bash
# From repo root
npm install
npm run dev:landing    # http://localhost:3000

cp apps/landing/.env.example apps/landing/.env.local
# Edit Firebase, Cloudinary, Strapi URLs as needed
```

## Production (Vercel)

- **Root Directory:** `apps/landing`
- **Domain:** `xtrawrkx.com` / `www.xtrawrkx.com`
- Set `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STRAPI_API_URL`, and secrets from `.env.example`

See [XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md](./XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md).

## Migration

- Remove nested `apps/landing/package-lock.json`; use root `package-lock.json` only.
- Commit `apps/landing/` to git (was untracked after monorepo merge).

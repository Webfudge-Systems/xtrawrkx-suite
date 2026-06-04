# Environment files

Used with [WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md) — copy `.env.production` into Railway (API) and Vercel (frontends).

Each app uses **three** env files:

| File | Committed | Purpose |
|------|-----------|---------|
| `.env.example` | Yes | Template with production URLs, placeholder secrets |
| `.env.local` | No | Local development |
| `.env.production` | No | Production values — copy into **Railway** / **Vercel** |

Root and app `.gitignore` exclude `.env`, `.env.local`, and `.env.production`.

## Production URLs (`*.xtrawrkx.com`)

| App | URL |
|-----|-----|
| API | `https://api.xtrawrkx.com` |
| CRM | `https://crm.xtrawrkx.com` |
| PM | `https://pm.xtrawrkx.com` |
| Accounts | `https://base.xtrawrkx.com` |
| Orbit | `https://orbit.xtrawrkx.com` |
| Landing | `https://xtrawrkx.com` |
| Client portal | `https://portal.xtrawrkx.com` |

## Backend (Strapi)

Strapi reads **`apps/backend/.env`** (not `.env.local` automatically).

```bash
cp apps/backend/.env.local apps/backend/.env
```

Railway: paste `apps/backend/.env.production` values into the API service, and set:

- `DATABASE_URL` from Postgres → `DATABASE_PRIVATE_URL`
- `REDIS_URL` from Redis service (linked to API)

## Next.js apps

Next.js loads `.env.local` in development and `.env.production` for `next build` when `NODE_ENV=production`.

For **Vercel**, set the same keys as `.env.production` in the project dashboard (Production environment).

## Landing secrets

Cloudinary and Firebase live in `apps/landing/.env.production` (gitignored). Never commit real `CLOUDINARY_API_SECRET` or SMTP passwords.

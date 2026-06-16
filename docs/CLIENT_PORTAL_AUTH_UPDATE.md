# Client Portal Sign-In Auth Update

## Summary

The client portal (`apps/xtrawrkx-client-portal`) posts to `POST /api/auth/client/login`, but the Strapi backend only exposed platform auth routes (`/auth/login`, `/auth/platform-login`). Requests to the client login path returned **405 Method Not Allowed**.

Client portal authentication is now implemented on the backend using **client-portal-access** credentials linked to CRM contacts and client accounts.

## Scope

- **Backend:** `apps/backend/src/utils/client-auth.js`, `apps/backend/src/api/auth/controllers/auth.js`, `apps/backend/src/api/auth/routes/auth.js`
- **Diagnostic:** `apps/backend/scripts/diagnose-client-portal-login.js`
- **Frontend (unchanged):** `apps/xtrawrkx-client-portal/src/lib/api/authService.js` — already calls the correct endpoints

## New API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/client/login` | Email + password login for client portal users |
| `POST` | `/api/auth/client/signup` | Create client account + portal access (auto-login on success) |
| `POST` | `/api/auth/client/verify-otp` | Legacy OTP step — confirms account exists; pass `password` to auto-login |
| `GET` | `/api/auth/client/check-email?email=` | Whether an email has portal access (signup pre-check) |
| `GET` | `/api/auth/client/dedicated-poc` | Dedicated POC for logged-in client (Bearer token) |

`GET /api/auth/me` now also accepts **client JWTs** (`type: 'client'`) and returns `{ type, account, contacts, contact }`.

## Login flow

1. Resolve CRM **contact** by email (primary contact fallback via client account email).
2. Load active **client-portal-access** row for that contact.
3. Validate password (bcrypt via users-permissions service).
4. Issue JWT with `{ type: 'client', portalAccessId, contactId, clientAccountId }`.
5. Return `{ jwt, token, account, contacts }` for localStorage in the portal.

Portal passwords are created during website signup (`syncPortalPassword` in `website-signup.js`) or when CRM provisions portal access on a contact.

## Usage / troubleshooting

Restart Strapi after pulling this change (`npm run dev` in `apps/backend` or monorepo dev).

Check whether an email has portal credentials:

```bash
cd apps/backend
node scripts/diagnose-client-portal-login.js user@example.com
```

If login returns **401 Invalid email or password** (not 405):

- Confirm the email matches a CRM contact with an active `client-portal-access` row.
- Reset or set the portal password in CRM / re-run website signup sync with `initialClientPassword`.
- Signup may have **silently skipped** CRM provisioning if company name was missing or duplicated (see below).

### Local dev: same database as CRM

| App | Config | Strapi URL | Data store |
|-----|--------|------------|------------|
| Backend | `apps/backend/.env` | `:1337` | Railway Postgres when `DATABASE_CLIENT=postgres` |
| CRM | `apps/crm/.env.local` | `http://localhost:1337` | Same DB via Strapi |
| Client portal | `apps/xtrawrkx-client-portal/.env.local` | `http://localhost:1337` | Same DB via Strapi |

Strapi loads **`apps/backend/.env` only** (not `.env.local`). CRM and portal both talk to local Strapi, which uses the Postgres URL in `.env` — so you are on the **same environment** as production data when that file points at Railway.

### Signup did not create a client in CRM

Website signup can return HTTP 200 without creating a client when:

- **Company name is missing** on the profile sync payload.
- **Company name matches an existing client** (e.g. `"Test"`) → backend returns **409** — sign in to the existing account or use a unique company name.

After a successful signup you should see a new row in CRM Clients and `check-email` should return `{ "exists": true }`.

## Before / after

| Before | After |
|--------|-------|
| `POST /api/auth/client/login` → 405 | → 200 with JWT + account, or 401 for bad credentials |
| Client token on `/api/auth/me` → user not found | → client session payload |

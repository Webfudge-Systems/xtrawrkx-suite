# Landing Website Signup → CRM Client Account

## Summary

When someone creates an account on the Xtrawrkx marketing site (`apps/landing`), the signup flow now provisions a **client account in CRM** under the **Xtrawrkx organization**, plus a primary contact and default onboarding project.

Previously, the landing app called unauthenticated Strapi CRUD endpoints (`POST /client-accounts`, `/contacts`, `/projects`), which failed because CRM controllers require an authenticated user and `ctx.state.orgId`.

## Scope

- **Backend:** `apps/backend/src/utils/website-signup.js`, `client-account` controller + `00-custom-client-account` route, `client-account` schema (`onboardingData` JSON field)
- **Landing:** `apps/landing/app/api/public/profile/route.js` (server-side profile sync)
- **Env:** `LANDING_SIGNUP_SECRET`, `WEBSITE_SIGNUP_ORG_ID` in backend; `LANDING_SIGNUP_SECRET` in landing

## Flow

1. User completes signup on the landing page (`publicUserService.signUp`).
2. Landing API route `POST /api/public/profile` syncs the profile and calls Strapi `POST /api/client-accounts/website-signup`.
3. Backend verifies `x-landing-signup-secret`, resolves the Xtrawrkx org, and idempotently:
   - Creates a **new client account** per distinct company name (same person may own multiple companies)
   - Re-syncs an existing account only when **company name and signup email** already belong together (profile retry)
   - Ensures a **primary contact** (`contactRole: PRIMARY_CONTACT`, `source: WEBSITE`)
   - Ensures a default **onboarding project**
   - Optionally stores portal password on **client-portal-access** when `initialClientPassword` is sent

## Configuration

Set the **same** secret on both services:

```env
# apps/backend/.env
LANDING_SIGNUP_SECRET=your-long-random-secret
WEBSITE_SIGNUP_ORG_ID=1

# apps/landing/.env.local
LANDING_SIGNUP_SECRET=your-long-random-secret
STRAPI_API_URL=http://localhost:1337/api
```

`WEBSITE_SIGNUP_ORG_ID` defaults to auto-detect: org with slug `xtrawrkx` or name containing "Xtrawrkx", then first org by id.

In local development, if `LANDING_SIGNUP_SECRET` is unset, the backend allows signup requests (production requires the secret).

## API

`POST /api/client-accounts/website-signup`

Headers:

- `x-landing-signup-secret`: shared secret (required in production)

Body: website profile fields (`email`, `companyName`, `firstName`, `lastName`, `industry`, address fields, `initialClientPassword`, etc.)

## Production troubleshooting

If signup fails on `www.xtrawrkx.com` with **403** or **Client account setup failed**:

1. **Vercel (landing app)** — set:
   - `LANDING_SIGNUP_SECRET` (same value as Strapi)
   - `STRAPI_API_URL` or `NEXT_PUBLIC_STRAPI_API_URL` → your Railway Strapi `/api` URL
2. **Railway (Strapi backend)** — set:
   - `LANDING_SIGNUP_SECRET` (must match Vercel exactly)
   - `WEBSITE_SIGNUP_ORG_ID` (Xtrawrkx org id, optional if auto-detect works)
3. Redeploy **both** services after changing env vars.

**401 on `/api/public/community-status`** (before this fix): the landing route called authenticated Strapi REST. Use `GET /api/client-accounts/public-community-status` (server-to-server with signup secret) instead — implemented in landing `community-status` route.

**Firestore `ERR_BLOCKED_BY_CLIENT`**: usually an ad-blocker; signup falls back to localStorage for profile data and does not block CRM provisioning.

**422**: company name missing on profile sync, or CRM returned success without a client account payload — complete company step on signup or use **Retry Setup** on profile.

Existing website users can use **Retry Setup** on their profile (re-triggers profile sync + client account provisioning).

## Landing login vs CRM client account

Landing **login** uses **Firebase** (email/password). CRM **client accounts** are provisioned separately via Strapi `website-signup`.

If CRM provisioning fails (duplicate company name, missing company, etc.), signup must **not** complete:

- `POST /api/public/profile` returns **409/422** when `ensureClientAccount` fails
- `publicUserService.signUp` **rolls back** the Firebase user and shows the error on the signup form
- Duplicate companies are blocked in the UI (`CompanyNameField`) and on the backend (`409`)

**Duplicate company example:** signing up with company **Webfudge Systems** when that client already exists creates a Firebase profile only if CRM sync is skipped or ignored — that path is now fixed.

## CRM contacts list — company & owner display

If contacts show **—** for company or **Unassigned** for owner:

1. **API fix:** contact list responses inherit `companyName` and `assignedTo` from linked lead companies / client accounts (`crm-relation-attach.js`).
2. **Data backfill:** run from `apps/backend`:
   ```bash
   TARGET_ORG_ID=1 node scripts/backfill-contact-lead-links.js
   ```
   This links contacts to leads/clients by email, copies `company_name`, and syncs owners from lead/client assignees.

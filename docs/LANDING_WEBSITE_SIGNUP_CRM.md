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
   - Creates or updates a **client account** linked to that organization
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

## Usage / Migration

1. Add env vars to Railway/Vercel for backend and landing.
2. Restart Strapi so `onboardingData` column is created on `client_accounts`.
3. New landing signups appear under **CRM → Clients → Client Accounts** in the Xtrawrkx org.

Existing website users can use **Retry Setup** on their profile (re-triggers profile sync + client account provisioning).

## CRM contacts list — company & owner display

If contacts show **—** for company or **Unassigned** for owner:

1. **API fix:** contact list responses inherit `companyName` and `assignedTo` from linked lead companies / client accounts (`crm-relation-attach.js`).
2. **Data backfill:** run from `apps/backend`:
   ```bash
   TARGET_ORG_ID=1 node scripts/backfill-contact-lead-links.js
   ```
   This links contacts to leads/clients by email, copies `company_name`, and syncs owners from lead/client assignees.

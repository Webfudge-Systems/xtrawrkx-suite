# Landing Signup Onboarding Email

## Summary

When a user creates a new account on the xtrawrkx marketing site (`apps/landing`), they now receive a **confirmation email on their personal sign-up address** with onboarding details, a direct link to the Client Portal, and recommended next steps.

The email is sent only for **new** CRM client accounts (HTTP `201` from website signup), not on profile re-syncs.

## Scope

- **Landing:** `apps/landing/app/api/public/profile/route.js` — triggers email after successful new client account creation
- **Email lib:** `apps/landing/src/lib/onboardingEmail.js`, `apps/landing/src/lib/emailTransporter.js`
- **Send API:** `apps/landing/app/api/send-email/route.js` — `account_onboarding` template type
- **Client helper:** `apps/landing/src/utils/emailUtils.js` — optional client-side retry via `/api/send-email`

## Flow

1. User completes signup (`publicUserService.signUp`).
2. Landing `POST /api/public/profile` provisions CRM client account via Strapi.
3. If Strapi returns **201** (new account), landing sends onboarding email to `body.email` (personal address).
4. Email includes:
   - Welcome / onboarding confirmation
   - Company name (when provided)
   - **Open Client Portal** button (`NEXT_PUBLIC_CLIENT_PORTAL_URL` + `/auth` with email prefilled)
   - Next steps: sign in, complete profile, explore communities, track onboarding project

Email delivery is **best-effort** — failures are logged in `onboardingEmailSync` but do not block signup.

## Configuration

Uses the same SMTP settings as other landing transactional emails:

```env
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://portal.xtrawrkx.com
NEXT_PUBLIC_CLIENT_PORTAL_AUTH_PATH=/auth
NEXT_PUBLIC_CLIENT_PORTAL_DASHBOARD_PATH=/dashboard
```

## API response

`POST /api/public/profile` may include:

```json
{
  "onboardingEmailSync": {
    "ok": true,
    "skipped": false,
    "recipient": "user@example.com"
  }
}
```

On email failure, `ok` is `false` with an `error` message; signup still succeeds if CRM provisioning succeeded.

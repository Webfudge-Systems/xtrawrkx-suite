# Landing Password Reset

## Summary

The xtrawrkx marketing site (`/auth`) and Client Portal share a **forgot password** flow backed by Firebase Auth. Reset emails are sent from the same SMTP identity as event registration emails (`xtrawrkx Events` via `EMAIL_USER`). After the user sets a new password, it is updated in **Firebase** and synced to **Strapi client-portal-access** so login works on both the landing site and Client Portal.

## Scope

- **Landing UI:** `apps/landing/src/components/auth/AuthForm.jsx` — "Forgot password?" on login
- **Reset page:** `apps/landing/app/(auth)/auth/reset-password/`
- **Landing APIs:**
  - `POST /api/auth/forgot-password` — generate Firebase reset link + branded email
  - `POST /api/auth/complete-password-reset` — apply Firebase reset + Strapi portal password sync
- **Email:** `apps/landing/src/lib/passwordResetEmail.js`, `transactionalEmail.js` (same sender as event emails)
- **Firebase:** `apps/landing/src/lib/firebaseAdmin.js`
- **Strapi sync:** `apps/backend/src/utils/client-auth.js` (`syncPortalPasswordByEmail`), `POST /api/auth/client/sync-password`
- **Client portal:** `apps/xtrawrkx-client-portal/src/app/api/auth/forgot-password` (proxy), forgot-password panel on `/auth`

## Flow

1. User clicks **Forgot password?** on landing `/auth` or Client Portal `/auth`.
2. Email submitted → `POST /api/auth/forgot-password` (portal proxies to marketing site).
3. Server generates a Firebase password-reset link and sends a branded email via SMTP (`xtrawrkx Events` / `EMAIL_USER`, reply-to `xsos@xtrawrkx.com`).
4. User opens link → `/auth/reset-password?oobCode=...`
5. Page verifies the code client-side, user enters a new password → `POST /api/auth/complete-password-reset`.
6. Server resets Firebase password and calls Strapi `POST /api/auth/client/sync-password` (secured with `LANDING_SIGNUP_SECRET`).
7. User signs in on landing (Firebase) or Client Portal (Strapi portal credentials) with the same password.

Email enumeration is avoided: the forgot-password API always returns the same success message whether or not the email exists.

## Client Portal

- **Sign-in:** `/auth` — **Forgot password?** next to the password field, or `/auth?mode=forgot`
- **Reset page:** `/auth/reset-password` (linked from portal-initiated reset emails)
- **API proxies:** `apps/xtrawrkx-client-portal/src/app/api/auth/forgot-password`, `verify-password-reset`, `complete-password-reset` → marketing site

Portal forgot-password requests pass `continueUrl` so reset emails open on the Client Portal. Landing-initiated resets still use `/auth/reset-password` on the marketing site.

Both reset pages call the same backend flow (Firebase + Strapi sync).

## Configuration

Uses the same SMTP settings as event registration emails (`EMAIL_USER` / `EMAIL_PASS` via nodemailer in `@webfudge/utils/email`):

```env
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
NEXT_PUBLIC_APP_URL=https://xtrawrkx.com
LANDING_SIGNUP_SECRET=your-long-random-secret   # landing + Strapi (portal password sync)
```

For branded reset emails (recommended in production), set a Firebase service account on landing:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Without a service account, forgot-password falls back to Firebase's built-in `sendOobCode` email.

Client portal must reach the marketing site for forgot-password:

```env
NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL=https://xtrawrkx.com
```

## Usage

- Landing sign-in: **Forgot password?** next to the password field, or `/auth?mode=forgot`
- Client Portal sign-in: **Forgot password?** on `/auth`
- Reset landing: `/auth/reset-password` (linked from email)

## Notes

- Strapi sync is best-effort when no CRM contact/portal row exists; Firebase reset still succeeds.
- Reset links expire per Firebase defaults (typically 1 hour).

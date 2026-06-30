# Landing Password Reset

## Summary

The xtrawrkx marketing site account portal (`/auth`) now supports **forgot password** with email delivery and an in-app reset page. Users on the sign-in form can request a reset link; the link opens `/auth/reset-password` where they set a new password.

## Scope

- **Landing UI:** `apps/landing/src/components/auth/AuthForm.jsx` — "Forgot password?" on login, forgot-password form, success state
- **Reset page:** `apps/landing/app/(auth)/auth/reset-password/` — verifies Firebase `oobCode`, sets new password
- **API:** `apps/landing/app/api/auth/forgot-password/route.js`
- **Email:** `apps/landing/src/lib/passwordResetEmail.js` (branded SMTP template)
- **Firebase Admin:** `apps/landing/src/lib/firebaseAdmin.js` — `generatePasswordResetLink` when service account is configured
- **Services:** `publicUserService.requestPasswordReset`, `verifyPasswordResetCode`, `completePasswordReset`
- **Context:** `PublicAuthContext.requestPasswordReset`

## Flow

1. User clicks **Forgot password?** on the sign-in form (or visits `/auth?mode=forgot`).
2. User enters email → `POST /api/auth/forgot-password`.
3. Server generates a Firebase password-reset link and sends a branded xtrawrkx email via SMTP.
4. User opens the link → `/auth/reset-password?oobCode=...&mode=resetPassword&...`
5. Page verifies the code, user enters a new password → `confirmPasswordReset`.
6. User returns to `/auth?mode=login`.

Email enumeration is avoided: the API always returns the same success message whether or not the email exists.

## Configuration

Uses the same SMTP settings as other landing transactional emails:

```env
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
NEXT_PUBLIC_APP_URL=https://xtrawrkx.com
```

For **branded** reset emails (recommended in production), set a Firebase service account:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# or
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Without a service account, the API falls back to Firebase's built-in `sendOobCode` email (default Firebase template).

## Usage

- Sign-in form: **Forgot password?** link next to the password field
- Direct URL: `/auth?mode=forgot`
- Reset landing: `/auth/reset-password` (linked from email)

## Notes

- Landing public accounts use **Firebase Auth**; this flow is separate from Strapi/Accounts app password reset.
- Reset links expire per Firebase defaults (typically 1 hour).

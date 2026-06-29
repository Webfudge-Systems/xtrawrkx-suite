# Landing Signup — `onboarding_data` Column Fix

## Summary

Landing website signup failed when creating CRM client accounts because production Postgres lacked the `onboarding_data` column, while the Strapi schema and `website-signup` flow already write `onboardingData` on every new account.

## Scope

- `apps/backend/src/api/client-account/content-types/client-account/schema.json` — `onboardingData` (JSON)
- `apps/backend/src/utils/website-signup.js` — sets `onboardingData` in `buildClientAccountPayload`
- `apps/backend/src/utils/ensure-client-account-schema.js` — bootstrap schema heal
- `apps/backend/scripts/migrate-client-accounts-onboarding-data.js` — manual Postgres migration
- `apps/backend/src/index.js` — runs ensure on Strapi bootstrap

## Error

```
column "onboarding_data" of relation "client_accounts" does not exist
```

Shown on the landing signup form when Strapi `POST /api/client-accounts/website-signup` tries to insert a row.

## Fix

### Automatic (recommended)

Redeploy or restart the Strapi backend. On bootstrap, it checks for `client_accounts.onboarding_data` and adds it if missing (Postgres: `JSONB`, SQLite: `JSON`).

### Manual (Railway / production Postgres)

```bash
cd apps/backend
DATABASE_URL="postgresql://..." npm run migrate:client-accounts-onboarding-data
```

Dry run:

```bash
DRY_RUN=true DATABASE_URL="postgresql://..." npm run migrate:client-accounts-onboarding-data
```

## Verification

1. Retry landing signup (or **Retry Setup** on an existing profile).
2. Confirm Strapi returns `201` with `clientAccount` in the response.
3. In CRM, the new client account should appear under the Xtrawrkx organization with onboarding fields populated.

## Related

- [LANDING_WEBSITE_SIGNUP_CRM.md](./LANDING_WEBSITE_SIGNUP_CRM.md) — full signup → CRM flow

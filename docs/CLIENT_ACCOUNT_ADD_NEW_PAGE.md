# Client Account — Add New Page & Schema Update

## Summary

The CRM **Add New Client Account** page (`/clients/accounts/new`) was rebuilt to match the **Add New Lead Company** pattern: multi-section cards, `@webfudge/ui` components, validation modal, success redirect, and user assignment. The Strapi **client-account** content type was extended with contract and billing fields, and **create** requests are validated server-side for required company fields and email format.

## Scope

- **CRM:** `apps/crm/app/clients/accounts/new/page.js`
- **Backend:** `apps/backend/src/api/client-account/content-types/client-account/schema.json`, `controllers/client-account.js`
- **Types:** `apps/backend/types/generated/contentTypes.d.ts` (Client Account attributes)

## Schema (new attributes)

| Field | Type | Purpose |
| ----- | ---- | ------- |
| `accountType` | string (default `STANDARD`) | Standard / Enterprise / Partner |
| `onboardingDate` | datetime | Onboarding date |
| `contractStartDate` | datetime | Contract start |
| `contractEndDate` | datetime | Contract end |
| `billingCycle` | string (default `MONTHLY`) | Monthly / Quarterly / Annually |
| `paymentTerms` | string (default `NET_30`) | Net 15 / 30 / 60, etc. |

**Note:** Annual revenue uses the existing `dealValue` decimal field. Run Strapi after pulling so the database picks up new columns.

## API validation (create)

`POST /api/client-accounts` requires:

- `companyName` (non-empty)
- `industry` (non-empty)
- `email` (valid email)

Optional date fields are normalized to `Date` objects; `healthScore` is clamped 0–100; `assignedTo` is parsed when present.

## Usage

Navigate to **Clients → Client Accounts → Add New** (or `/clients/accounts/new`). Required fields: company name, industry, company email. Submit creates the account and redirects to the new account detail page.

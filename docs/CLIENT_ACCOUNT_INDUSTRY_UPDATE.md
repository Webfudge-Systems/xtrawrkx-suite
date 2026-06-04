# Client Account Industry & Sub-type Update

## Summary

Expanded industry choices on client account forms, added a custom text field when **Other** is selected, and removed **Sub-type** from client accounts (schema, UI, and lead conversion).

## Scope

- **Shared options:** `apps/crm/lib/leadCompanyProfileOptions.js` (industry list + helpers)
- **CRM client UI:** `apps/crm/app/clients/accounts/new/page.js`, `[id]/edit/page.js`, `[id]/page.js`
- **Backend:** `apps/backend/src/api/client-account/content-types/client-account/schema.json`, lead conversion in `lead-company` controller

## Details

### Industry

- Preset list grew from 9 to 26 sectors (e.g. Software & SaaS, Insurance, Logistics, Government).
- Selecting **Other** shows **Specify industry**; the typed value is saved on `industry` (not the literal `other`).
- Helpers: `INDUSTRY_OTHER_VALUE`, `industryFormFromStored`, `resolveIndustryForSave`.

### Sub-type removed (client accounts only)

- `subType` attribute removed from `client-account` content type.
- Sub-type UI removed from create, edit, and account detail inline edit.
- Lead → client conversion no longer copies `subType`.
- Lead companies use company type only (sub-type removed; see [LEAD_COMPANY_SUBTYPE_REMOVAL.md](./LEAD_COMPANY_SUBTYPE_REMOVAL.md)).

## Usage / Migration

1. Restart Strapi after pulling so the `client-account` schema reloads (drops `subType` column on SQLite/Postgres as Strapi migrates).
2. Existing `subType` values on client accounts are no longer exposed in the API after schema change; industry custom values remain on `industry`.
3. To enter a custom industry: choose **Other**, then type the label in **Specify industry**.

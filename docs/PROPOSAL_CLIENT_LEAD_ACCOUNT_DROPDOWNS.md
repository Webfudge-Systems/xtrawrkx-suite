# Proposal client picker: Lead Company & Client Account

## Summary

New and edit proposal forms use two mutually exclusive dropdowns (**Lead Company** and **Client Account**) instead of typing the client company name manually. Choosing one clears the other, fills **Prepared For** fields from CRM data, and persists `leadCompany` / `clientAccount` relations on the proposal.

## Scope

- `apps/crm/app/clients/proposals/new/page.js`
- `apps/crm/app/clients/proposals/[id]/edit/page.js`
- `apps/crm/lib/proposalClientAutofill.js` — maps entity + contacts → `clientCompanyName`, `clientContactName`, `clientEmail`, `clientPhone`, `clientAddress`

## Behavior

- **Lead dropdown**: Lists lead companies where `isConvertedLeadCompany` is false (same rule as deals: `CONVERTED` / `CLIENT` status, populated `convertedAccount`, etc.).
- **Client Account dropdown**: All client accounts (sorted by name).
- **Autofill**: Uses `filterContactsForCompany` + `mapClientAccountToBillTo` / `pickPrimaryContact` (invoice helpers) so primary contact and company-level fallbacks match other CRM flows.
- **Company name field**: Prefilled from the selection but remains editable (e.g. legal name tweaks). Clearing both dropdowns clears all client detail fields.
- **Edit / legacy**: If a proposal has text fields but no relations, validation still allows save when `clientCompanyName` is present.

## Usage / migration

No migration required. Existing proposals without relations continue to load; editors can pick a lead or account to attach relations and refresh client fields.

# Invoice Bill-To Contact Dropdown

## Summary

Invoice **new** and **edit** forms now load CRM contacts (same pattern as **Sales → Deals → New**) and show a **Bill-to contact** dropdown filtered by the selected **client account**. Choosing a contact fills **Contact name**, **email**, and **phone** from that record; company and billing address still come from the client account.

## Scope

- `apps/crm/app/clients/invoices/new/page.js` — parallel fetch of client accounts + contacts (`pagination[pageSize]: 500`, `populate: ['leadCompany','clientAccount']`), contact `Select`, sync when contacts finish loading.
- `apps/crm/app/clients/invoices/[id]/edit/page.js` — same; initial dropdown value matches saved bill name/email when possible.
- `apps/crm/lib/invoiceClientAutofill.js` — `mapClientAccountFieldsOnly`, `contactToBillToFields`, `mergeBillToFromAccountAndContact` (account base + optional contact).
- `apps/crm/lib/dealFormOptions.js` — reused: `filterContactsForCompany`, `defaultPrimaryContactId`, `contactOptionValue`, `contactRowMatchesId`, `contactDisplayName`.

## Usage

1. Select **Client account** (optional but required to filter contacts).
2. Select **Bill-to contact** from the list linked to that account.
3. Edit any bill fields manually if needed; save persists `clientAccount` and the text bill-to fields (no stored invoice→contact relation unless added later).

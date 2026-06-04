# CRM Contact Company Association Update

## Summary

Contacts can be linked to either a **lead company** or a **client account** (not both at once in the UI). Creating a contact from a client account detail page now pre-fills company fields and saves the `clientAccount` relation. The create and edit contact forms share the same company association controls.

## Scope

- `apps/crm/app/clients/accounts/new/page.js` — **Contact persons** section on create (multi-contact, primary flag, linked via `clientAccount` on save)
- `apps/crm/app/clients/accounts/[id]/page.js` — Add contact links include `?clientAccount=<id>`
- `apps/crm/app/sales/contacts/new/page.js` — Company association section, URL prefill, create payload
- `apps/crm/app/sales/contacts/[id]/edit/page.js` — Editable lead + client dropdowns, mutual exclusivity
- `apps/crm/lib/contactCompanyFields.js` — Map entity → contact company/address fields
- `apps/crm/lib/api/contactService.js` — Explicit `null` to clear relations on update

## Usage

- From **Client account → Contacts → Add contact**: opens `/sales/contacts/new?clientAccount=<id>` with company name, website, and address fields filled; client account is pre-selected.
- Optional: `/sales/contacts/new?leadCompany=<id>` for lead company context.
- On create/edit: selecting **Lead company** clears **Client account** (and vice versa). The other dropdown is disabled while one is selected.

## Migration

No schema changes. Existing contacts with both relations in the database show **client account** as the active link on edit (lead cleared in the form only until save).

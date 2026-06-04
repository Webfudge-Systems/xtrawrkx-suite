# Client account detail & edit UI

## Summary

The client account **detail** (`/clients/accounts/[id]`) and **edit** (`/clients/accounts/[id]/edit`) pages were rebuilt to align with the lead company and contact detail/edit patterns: header actions, KPI row, pill tabs, two-column overview, assignee modal, contacts tab, and activity timeline when a converted lead exists.

## Scope

- `apps/crm/app/clients/accounts/[id]/page.js` — detail UI
- `apps/crm/app/clients/accounts/[id]/edit/page.js` — full form (company, address, account, contract/billing, social/notes)
- `apps/crm/lib/api/clientAccountService.js` — `getOne(id, options)`, `update` maps numeric `assignedTo` to Strapi connect format

## Notes

- Activities on the detail page use `fetchActivityTimeline({ leadCompanyId })` when `convertedFromLead` is populated; otherwise the timeline explains the limitation.
- Edit form validation matches create: company name, industry, and company email required.

# CRM Filter Modals Update (Leads, Contacts, Clients)

## Summary
Added working filter modals to the three CRM list pages where filter actions previously used placeholder callbacks.  
Users can now open a modal, select filter criteria, apply them to table results, and reset quickly with Clear All.

## Scope
- `apps/crm/app/sales/lead-companies/page.js`
- `apps/crm/app/sales/contacts/page.js`
- `apps/crm/app/clients/accounts/page.js`

## Details
- Connected page-level filter actions (`onFilterClick`) to real `Modal` dialogs.
- Added per-page filter state with draft/apply behavior:
  - `draftFilters`: user edits in modal before confirmation
  - `appliedFilters`: active filters used by table data
- Added filter application flow:
  - `Apply Filters` updates `appliedFilters` and refreshes results.
  - `Clear All` resets both draft and applied filters.
  - Existing search and tab filters continue to work and combine with modal filters.
- Pagination now resets to page 1 when modal filters change.

### Lead Companies filters
- Status
- Source
- Company Type
- Sub-Type (scoped by selected company type)
- Assigned To
- Company text match
- Created date range
- Deal value range

### Contacts filters
- Status
- Source
- Preferred contact method
- Assigned To
- Company text match
- Email availability (has / missing)
- Phone availability (has / missing)
- Created date range

### Client Accounts filters
- Status
- Industry
- Account type
- Billing cycle
- Assigned To
- Company text match
- Created date range
- Deal value range
- Health score range

## Usage
1. Open any of the three list pages.
2. Click the filter icon/button in the header toolbar.
3. Set one or more criteria.
4. Click `Apply Filters` to update table rows.
5. Use `Clear All` to remove all active modal filters.

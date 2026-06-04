# Lead company ↔ contacts (backend + CRM)

## Summary

Lead companies can own multiple **contacts** (people). Creating a lead company from the CRM now persists each contact row in Strapi with `leadCompany` set, and the lead company detail page loads **`contacts`** so the **Contacts** tab lists linked people.

## Scope

- **Backend (`apps/backend`)**
  - `lead-company` schema: inverse relation `contacts` (`oneToMany`, `mappedBy: leadCompany`).
  - `contact` schema: `contactRole` (string), `isPrimaryContact` (boolean, default `false`).
  - `lead-company` controller: `contacts` allowed in `populate` sanitization.
- **CRM (`apps/crm`)**
  - `leadCompanyService.getOne`: default populate includes `contacts`.
  - `leadCompanyService.create`: returns `id` from normalized entry.
  - `contactService`: maps `contactRole` and `isPrimaryContact` in create/update payloads.
  - Add Lead Company form: sends `jobTitle`, `contactRole`, `isPrimaryContact`, `companyName`, `source: LEAD_COMPANY` (replaces invalid `title` / `role` / `isPrimary` fields).
  - Lead company detail **Contacts** tab: lists `companyContacts` with Primary / role badges and link to `/sales/contacts/[id]`.

## Lead company list/detail (`GET /lead-companies`, `GET /lead-companies/:id`)

Populate on the inverse relation `contacts` (`oneToMany`, `mappedBy: leadCompany`) does not always return linked rows from `entityService`. The lead-company controller loads **all contacts for the org** (cap 5000), keeps those whose `leadCompany` id matches any lead on the current page (using both `id` and `documentId` keys), merges them onto each company, and sorts so **primary contacts** come first. Relation-level `$in` filters were avoided after they returned no rows in some environments.

The CRM lead companies table also calls **`leadCompanyService.getAll({ mergeContactsFromContactsApi: true })`**, which merges **`GET /contacts`** (same source as the detail **Contacts** tab) so the table stays correct even before the backend is restarted.

## Contact list API (`GET /contacts`)

The contact controller merges **`filters.leadCompany`** from the query string with the required **`organization`** scope so the CRM can request contacts for a single lead company (e.g. lead company detail **Contacts** tab).

## Migration

After pulling schema changes, **restart Strapi** so it applies the new columns and relation. Existing contacts without `leadCompany` are unchanged.

## Usage

1. **Add New Lead Company** → fill Contact Information → submit. Contacts are created after the lead company row exists.
2. Open the lead **Contacts** tab → see people; click a row to open the contact detail page.

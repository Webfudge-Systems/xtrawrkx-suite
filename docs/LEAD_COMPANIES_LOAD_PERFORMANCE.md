# CRM List Pages — Load Performance

## Summary

Lead Companies and Contacts list pages were slow because they downloaded **all** rows (and, for leads, **all contacts**) on every visit. Both pages now use **server-side pagination** (15 rows per request), **dedicated stats endpoints** for KPI/tab counts, and **scoped backend queries** instead of client-side filtering.

## Root causes

### Lead Companies (`/sales/lead-companies`)

1. **`mergeContactsFromContactsApi: true`** — On each page load, the frontend called `contactService.fetchAll()` (~5,800 contacts, ~59 API calls) even though the backend already attaches contacts for the current page via `populate`.
2. **Backend contact attach fallback** — When the scoped `$in` query returned zero rows, the controller loaded up to 5,000 org-wide contacts per list request.

### Contacts (`/sales/contacts`)

1. **`contactService.fetchAll()` on mount** — Loaded all ~5,800 contacts before showing the table.
2. **Client-side filter/sort/paginate** — Search, tabs, and advanced filters ran in the browser on the full dataset.
3. **Filter dropdowns from full list** — Assignee/source options were derived by scanning every loaded contact.

## Changes

### Backend (`apps/backend`)

**Lead companies**

- `attachContactsToLeadCompanies` — Reads `contacts_lead_company_lnk` for the current page’s lead IDs, then loads only those contacts (entityService `leadCompany.id $in` was returning empty in Strapi 5).
- Existing: `GET /lead-companies/stats`, `buildLeadListFilters`, scoped contact attach on `find`.

**Contacts**

- `GET /contacts/stats` — Fast counts for total, withEmail, withPhone, withCompany + source/preferred-method facets.
- `find` — Merges full `query.filters` (search, tabs, date range, assignee, etc.) via `buildContactListFilters`.

### CRM frontend

**Lead Companies page**

- Removed `mergeContactsFromContactsApi: true`; relies on backend `populate` + scoped attach.

**Contacts page**

- Server-side pagination via `contactService.buildListParams` + `getAll`.
- Tab/KPI counts from `contactService.getStats()` (`GET /contacts/stats`).
- Assignee filter options from org users API (same pattern as Lead Companies).
- Debounced search; filters/tabs/sort sent to API.

**Services**

- `contactService.buildContactListParams` / `getStats` — mirror lead-companies list pattern.
- `leadCompanyService.mergeContactsOntoLeadCompanies` — When used (dashboard `fetchAll` + merge), fetches contacts by lead ID chunks instead of full org scan.

## Usage / migration

- Restart the Strapi backend after deploy so `/contacts/stats` is registered.
- Hard refresh CRM (or clear Redis API cache if enabled).
- Dashboard widgets that need full datasets still use `fetchAll()`; list UI does not.

## Scope

| Area | Files |
|------|--------|
| Backend lead | `src/api/lead-company/controllers/lead-company.js` |
| Backend contact | `src/api/contact/controllers/contact.js`, `routes/contact.js` |
| CRM services | `lib/api/leadCompanyService.js`, `lib/api/contactService.js` |
| CRM pages | `app/sales/lead-companies/page.js`, `app/sales/contacts/page.js` |

## Relation attach (CRM + PM)

Strapi 5 `entityService` populate often returns **empty** for manyToOne / inverse oneToMany relations even when `_lnk` rows exist. List endpoints now hydrate via `apps/backend/src/utils/crm-relation-attach.js`:

| Entity | Attached relations |
|--------|-------------------|
| Contact | `leadCompany`, `clientAccount`, `assignedTo` |
| Client account | `contacts[]`, `assignedTo` |
| Deal | `assignedTo`, `leadCompany`, `clientAccount`, `contact` |
| Project | `projectManager`, `teamMembers` |
| Task | `assignee`, `assigner`, `collaborators` |

**Assignee backfill:** `node scripts/backfill-deal-account-assignees.js` copies owners from linked lead companies onto deals (14) and client accounts matched by company name (5).


| Before | After |
|--------|--------|
| Lead list: stats + 15 rows + ~59 contact pages | Lead list: stats + 1 paginated request (~15 rows + scoped contacts) |
| Contacts list: ~59 pages then client filter | Contacts list: stats + 1 paginated request |
| KPI/tab counts wait for full download | KPI/tab counts from stats immediately |

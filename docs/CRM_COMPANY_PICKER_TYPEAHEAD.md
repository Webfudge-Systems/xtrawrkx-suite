# CRM Company Picker (Async Typeahead)

## Summary

Company dropdowns on CRM create/edit forms no longer load a capped first page (100 or 500 rows). They search the API as the user types, so every lead company and client account can be found. The shared `Select` menu also sizes in whole rows so the last name is not clipped.

## Scope

- **UI:** `packages/ui/components/Select/Select.jsx` — `asyncSearch`, `onSearch`, `loading`, `hasMore`, `onLoadMore`, `selectedLabel`; taller portaled list; no dual max-height clipping
- **Backend:** `apps/backend/src/api/client-account/controllers/client-account.js` — list `find` now applies org-scoped query filters (needed for `companyName $containsi`)
- **CRM services:** `leadCompanyService.searchForPicker`, `clientAccountService.searchForPicker`, `contactService.listForCompany`
- **CRM picker:** `apps/crm/lib/companyPicker.js`, `apps/crm/components/CompanyPicker.jsx`
- **Forms:** deals, contacts, proposals, meetings, tasks (create modal), invoices

## Why the old list was truncated

1. Forms called `getAll({ pagination[pageSize]: 100 })` (or 500) once and never walked further pages.
2. Dropdown search was **client-side** on that page only, so names after the first page never appeared.
3. Raising `pageSize` was not durable: backend caps, org growth, and list-page performance work kept reintroducing a cap.
4. The Select panel used a short `max-h-52` plus `overflow-hidden`, so the last visible row looked cut off even when more rows existed.

Contact create/edit already used `fetchAll()`; deal **new** was left on a single page of 100.

## Details

- Opening the menu loads page 1 (40 rows, A–Z).
- Typing queries `filters[companyName][$containsi]` (debounced 250ms).
- **Load more** (scroll or button) appends the next page.
- Converted lead companies are excluded from the lead picker (`status $notIn CONVERTED/CLIENT`); a converted value already on the record still shows as “(converted)”.
- Deal forms load **contacts for the selected company** instead of a global 500-row contact dump.

Do **not** “fix” picker truncation by bumping `pageSize` on `getAll`. Use `CompanyPicker` (or `searchForPicker`) on any new company dropdown.

## Usage

```jsx
import CompanyPicker from '../../../components/CompanyPicker';

<CompanyPicker
  type="leadCompany" // or "clientAccount"
  value={form.leadCompany}
  onChange={(id, item) => setField('leadCompany', id)}
  placeholder="Select lead company"
  searchPlaceholder="Search lead companies…"
  hydrateOnSelect // getOne on pick when you need contacts / autofill fields
/>
```

## Migration

Restart the Strapi backend so client-account list filters are active. Hard-refresh CRM. Open **Sales → Deals → Add**, search a company that is not in the first 40 A–Z names, and confirm it appears.

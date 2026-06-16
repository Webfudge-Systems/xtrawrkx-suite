# Client Portal Header Update (Export-only)

## Summary
Updated the client-portal list page headers to remove **Add** and **Filter** buttons and keep **Export** only, aligned with the CRM/PM header pattern.

## Scope
- `apps/xtrawrkx-client-portal/src/components/ui/PageHeader.jsx`
- Client portal list pages:
  - `apps/xtrawrkx-client-portal/src/app/(protected)/projects/page.jsx`
  - `apps/xtrawrkx-client-portal/src/app/(protected)/tasks/page.jsx`
  - `apps/xtrawrkx-client-portal/src/app/(protected)/company/page.jsx`
  - `apps/xtrawrkx-client-portal/src/app/(protected)/events/page.jsx`
- New helper:
  - `apps/xtrawrkx-client-portal/src/lib/exportUtils.js`

## Details
- `PageHeader` now renders only the **Export** action (when `onExportClick` is provided).
- Client portal pages now pass `onExportClick` to download the currently filtered/sorted list as a CSV.
- The **Add** and **Filter** header controls were removed from these pages by removing:
  - `onAddClick` / `onFilterClick` props passed into `PageHeader`.

## Usage / Verification
1. Open the following pages in the client portal:
   - Projects
   - Tasks
   - Company Members
   - Events
2. Confirm the header shows only an **Export** button.
3. Click **Export** and verify a CSV download starts (containing object keys/values from the current list view).


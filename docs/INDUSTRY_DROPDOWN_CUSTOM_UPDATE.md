# Industry Dropdown — Custom Values & Shorter Preset List

## Summary

Industry fields on client account and lead company forms now support adding custom industries from the searchable dropdown, remember them for future forms, and use a shorter preset list.

## Scope

- **Shared:** `packages/utils/src/crmShared/leadCompanyProfileOptions.js`
- **UI:** `packages/ui/components/Select/Select.jsx`, `packages/ui/hooks/useIndustrySelectOptions.js`
- **CRM:** client account + lead company create/edit/detail pages; `apps/crm/lib/industryOptionsLoader.js`
- **PM:** client account create/edit/detail pages; `apps/pm/lib/industryOptionsLoader.js`

## Details

### Shorter preset list

Presets reduced from 26 sectors to 12 core options plus **Other** (Technology, Software & SaaS, Healthcare, Finance, Manufacturing, Retail, E-commerce, Education, Real Estate, Consulting, Media & Entertainment, Logistics & Transportation).

### Add custom industry

- Open the **Industry** dropdown and search.
- If no match exists, choose **Add "…"** at the bottom of the list.
- The value is saved on the account/lead as before.

### Shows again next time

Custom industries are merged into the dropdown from:

1. **Existing records** — distinct `industry` values loaded from client accounts (and lead companies in CRM).
2. **Browser cache** — `localStorage` key `webfudge_custom_industries` after you save a new custom value.

Legacy **Other** + **Specify industry** still works for older records.

## Usage

No migration required. Existing stored industry strings continue to load; non-preset values appear in the merged dropdown automatically.

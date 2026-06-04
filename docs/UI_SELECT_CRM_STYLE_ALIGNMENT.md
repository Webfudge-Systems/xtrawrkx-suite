# UI Select (CRM style alignment)

## Summary
Updated the shared `@webfudge/ui` `Select` component styling to match the CRM dropdown `<select>` look (border/bg/padding and orange focus ring behavior).

## Scope
- Package: `packages/ui/components/Select/Select.jsx`
- Consumers:
  - `apps/books/app/reports/components/BooksSystemAnalytics.tsx` (Fiscal range + Accounting basis dropdowns)

## Details
- Replaced the previous `Select` default classes (shadow-sm / focus:border-transparent) with CRM-aligned classes:
  - `rounded-lg`, `border-gray-300`, `bg-white`, `px-3 py-2.5 text-sm`
  - `focus:border-orange-500` + `focus:ring-orange-500/20`


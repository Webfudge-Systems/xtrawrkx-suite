# Books App Update Summary

## Summary
Added a new app at `apps/books` to scaffold a Zoho Books-inspired accounting product that aligns with the existing CRM/PM design system and is optimized for agency billing workflows.

## Scope
- New app: `apps/books`
- Shared integrations: `@webfudge/ui`, `@webfudge/auth`, `@webfudge/utils`, `@webfudge/hooks`, `@supabase/supabase-js`
- Root update: `package.json` script `dev:books`

## Details
- Added full app shell:
  - `app/layout.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Topbar.tsx`, `components/layout/LayoutContent.tsx`
  - `components/configure-features/ConfigureFeaturesModal.tsx` with local + Supabase persistence hook
- Added all requested primary routes and sub-routes under:
  - Home dashboard
  - Items, Banking
  - Sales and Purchases sub-modules
  - Time Tracking
  - Accountant
  - Reports
  - Documents and Bank Statements
- Added agency-focused dashboard surface and module scaffolding:
  - KPI cards for receivables/payables/unbilled hours/unbilled expenses
  - Chart placeholders and table shells using shared components
- Added typed data layer:
  - `lib/types.ts` for all core domain entities
  - `lib/api.ts` with typed Strapi wrappers and per-entity helpers
  - `lib/supabase.ts` client singleton for storage/preferences use cases

## Strapi Content Type Spec
Implement the following collection types in Strapi (`apps/backend/src/api/...`), matching names used in `apps/books/lib/api.ts`:
- `books-customer`: customer profile, client type, receivables, credits, addresses
- `books-vendor`: vendor profile, payables, credits
- `books-item`: service/goods/digital/retainer/milestone items
- `books-invoice`: invoice headers, status enum, line items, project linkage, milestone/retainer fields
- `books-expense`: category, billable toggle, client/project linkage, reimbursable flag
- `books-project`: billing method enum, budget, status, customer relation
- `books-time-entry`: billable/invoiced flags, task, user, project relation
- `books-bill`: vendor billing records and totals
- `books-manual-journal`: journal metadata and entry payload
- `books-bank-account`: bank/cash/card/clearing account types and balances
- `books-bank-transaction`: categorized/uncategorized transaction status
- `books-document`: file metadata, inbox classification (`AllDocuments`, `BankStatements`), processing status

## Usage / Migration
- Run `npm run dev:books` from the repo root to start the Books app.
- Required environment variables:
  - `NEXT_PUBLIC_STRAPI_URL`
  - `STRAPI_API_TOKEN` (for server contexts)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

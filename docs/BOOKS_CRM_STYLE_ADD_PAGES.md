# Books CRM-Style Add Pages

## Summary
Updated the Books app so “Add” flows for `Sales`, `Purchases`, and `Accountant` open CRM-style create pages (consistent form-section layout, inputs, and action buttons) using `@webfudge/ui` components.

## Scope
- Updated header/breadcrumb behavior for `/sales/*/new`, `/purchases/*/new`, `/accountant/*/new`
- Added a shared Books form renderer for add pages
- Added dynamic create routes (so every module has an “Add” destination even if a dedicated `new/page.tsx` wasn’t previously created)

## Details
### Header / breadcrumbs on add routes
`apps/books/components/layout/Topbar.tsx` now:
- Displays `Add New <Module>` for `.../new` routes (CRM-like title)
- Labels the last breadcrumb segment as `Add New`
- Hides header actions/search on add routes (to match CRM “Add page” layout)
- Exposes header “Add” for all supported Sales/Purchases/Accountant modules

### Shared CRM-style add form
`apps/books/app/_components/BooksCrmAddEntityPage.tsx`
- Renders CRM-like `FormSectionCard` sections with `Input`, `Select`, `Textarea`
- Validates required fields client-side and shows a CRM-like “Validation Error” panel
- Uses a consistent footer with `Cancel` + gradient `Create/Save` button

### Dynamic create routes
Created:
- `apps/books/app/sales/[module]/new/page.tsx`
- `apps/books/app/purchases/[module]/new/page.tsx`
- `apps/books/app/accountant/[module]/new/page.tsx`

These routes build the form configuration per module key, so paths like:
- `/sales/estimates/new`
- `/purchases/bills/new`
- `/accountant/transaction-locking/new`
open the consistent add UI.

## Notes / Future wiring
Backend persistence for create actions is not wired yet; the pages currently provide UI + client-side validation only.


# CRM Reusable UI Refactor Update

## Summary
CRM and PM shared a lot of repeated app-level UI wrappers across forms, list/detail pages, and table screens. This update moves those repeated patterns into reusable `@webfudge/ui` components/layouts while preserving existing CRM visual styling.

## Scope
- `packages/ui`
  - `packages/ui/components/FormSectionCard/FormSectionCard.jsx`
  - `packages/ui/components/FormSectionCard/index.js`
  - `packages/ui/components/WorkspaceHeader/WorkspaceHeader.jsx`
  - `packages/ui/components/WorkspaceHeader/index.js`
  - `packages/ui/components/index.js`
  - `packages/ui/layouts/AppShell/AppShell.jsx`
  - `packages/ui/layouts/AppShell/index.js`
  - `packages/ui/layouts/index.js`
- `apps/crm`
  - `apps/crm/app/sales/contacts/new/page.js`
  - `apps/crm/app/sales/lead-companies/new/page.js`
  - `apps/crm/app/sales/lead-companies/[id]/edit/page.js`
  - `apps/crm/app/clients/accounts/new/page.js`
  - `apps/crm/app/clients/accounts/[id]/edit/page.js`
  - `apps/crm/components/CRMPageHeader.jsx`
  - `apps/crm/components/LayoutContent.jsx`
- `apps/pm`
  - `apps/pm/components/PMPageHeader.jsx`
  - `apps/pm/components/LayoutContent.jsx`

## Details
- Added shared component:
  - `FormSectionCard` wraps `Card` and renders:
    - optional icon
    - section title
    - section description
    - section body (`children`)
  - Supports class overrides:
    - `cardClassName`
    - `iconContainerClassName`
    - `iconClassName`
    - `headerClassName`
- Exported from package index so apps can consume directly through `@webfudge/ui`.
- Replaced repeated section-header/card markup in CRM forms with `FormSectionCard`.
- Preserved existing CRM visual identity by passing the same gradient/spacing classes through `cardClassName` and `iconContainerClassName`.
- Added shared page-level primitives:
  - `WorkspaceHeader` for reusable page header behavior (breadcrumb, search, actions, notifications, profile dropdown, global-search modal hook).
  - `AppShell` for reusable authenticated layout wrapper (auth guard, login redirect, sidebar wiring, loading/redirect states).
- Updated CRM + PM header components to become thin wrappers around shared `WorkspaceHeader`.
- Updated CRM + PM layout wrappers to use shared `AppShell`.

## Before / After
- Before:
  - Each CRM form page manually implemented section wrappers and icon/title blocks.
  - Style consistency required repeating large JSX blocks.
- After:
  - The shared pattern lives in `packages/ui`.
  - CRM and PM pages are thinner and more maintainable across forms, table/list pages, and detail screens.
  - Other apps can reuse the same shell/header components without copying app-specific JSX.

## Usage
- Import from package:
  - `import { FormSectionCard } from '@webfudge/ui'`
- For page-level wrappers:
  - `import { WorkspaceHeader, AppShell } from '@webfudge/ui'`
- Example:
  - Use `icon`, `title`, and `description` for header content.
  - Pass CRM-compatible styles via `cardClassName` and `iconContainerClassName`.

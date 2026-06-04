# CRM Table Delete Modal Standardization

## Summary
Delete confirmation UX was standardized across CRM table actions by replacing ad-hoc overlays and native `window.confirm` dialogs with the shared `Modal` component from `@webfudge/ui`. This removes the top white gap issue seen in the Lead Companies delete dialog and makes delete flows visually consistent.

## Scope
- `apps/crm/app/sales/lead-companies/page.js`
- `apps/crm/app/sales/contacts/page.js`
- `apps/crm/app/clients/accounts/page.js`
- `apps/crm/app/sales/lead-companies/[id]/edit/page.js`

## Details
- **Lead Companies list**
  - Replaced custom fixed overlay + `Card` delete dialog with shared `Modal`.
  - Preserved existing warning content and delete loading state.
  - Fixes the visible top white gap in the previous custom dialog.
- **Contacts list**
  - Replaced native `window.confirm` delete flow with a shared `Modal`.
  - Added explicit open/confirm/cancel state management for row delete action.
- **Client Accounts list**
  - Replaced native `window.confirm` delete flow with a shared `Modal`.
  - Added explicit open/confirm/cancel state management for row delete action.
- **Lead Company edit page (linked contacts table)**
  - Replaced native `window.confirm` delete flow with a shared `Modal`.
  - Added explicit open/confirm/cancel state management for contact deletion.

## Usage Notes
- All table delete actions now:
  - open a `Modal` confirmation step,
  - support loading/disabled states while deletion is in progress,
  - prevent accidental closure while delete is pending.

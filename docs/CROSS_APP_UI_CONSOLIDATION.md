# Cross-App UI Consolidation (PM → CRM → Accounts)

## Summary

Extracted duplicated components, layout logic, and utility files from PM, CRM, and Accounts into the shared `@webfudge/ui` and `@webfudge/utils` packages. All three apps now render through a unified layout shell and share the same sort, RBAC-denied, and industry-visual infrastructure.

## Scope

| Package / App | File | Change |
|---|---|---|
| `@webfudge/ui` | `components/TableSortDropdown/` | **New** — positioned `TableSortPanel` wrapper (was duplicated in PM + CRM) |
| `@webfudge/ui` | `components/AccessDeniedPanel/` | **New** — `centered` + `card` variants for RBAC-denied states |
| `@webfudge/ui` | `components/WorkspaceLayoutContent/` | **New** — `AppShell` + PWA + RBAC gate, configurable per-app |
| `@webfudge/ui` | `utils/industryVisuals.js` | **New** — `getIndustryVisual()` with lucide-react icons (moved from PM+CRM) |
| `@webfudge/utils` | `src/crmShared/leadCompanyProfileOptions.js` | **New** — industry / company-type option lists + helpers (moved from PM+CRM) |
| `@webfudge/utils` | `src/crmShared/contactCompanyFields.js` | **New** — `contactFieldsFromClientAccount` / `contactFieldsFromLeadCompany` (moved from PM+CRM) |
| `apps/pm` | `components/PmTableSortDropdown.jsx` | Thin re-export of `TableSortDropdown` from `@webfudge/ui` |
| `apps/pm` | `components/LayoutContent.jsx` | Uses `WorkspaceLayoutContent` |
| `apps/pm` | `lib/leadCompanyProfileOptions.js` | Re-exports from `@webfudge/utils` |
| `apps/pm` | `lib/contactCompanyFields.js` | Re-exports from `@webfudge/utils` |
| `apps/pm` | `lib/industryVisuals.js` | Re-exports from `@webfudge/ui/utils/industryVisuals` |
| `apps/crm` | `components/CrmTableSortDropdown.jsx` | Thin re-export of `TableSortDropdown` from `@webfudge/ui` |
| `apps/crm` | `components/LayoutContent.jsx` | Uses `WorkspaceLayoutContent` |
| `apps/crm` | `lib/leadCompanyProfileOptions.js` | Re-exports from `@webfudge/utils` |
| `apps/crm` | `lib/contactCompanyFields.js` | Re-exports from `@webfudge/utils` |
| `apps/crm` | `lib/industryVisuals.js` | Re-exports from `@webfudge/ui/utils/industryVisuals` |
| `apps/crm` | `components/ui/BaseModal.jsx` | **Deleted** — unused orphan (replaced by `WorkspaceSearchModal`) |
| `apps/accounts` | `components/LayoutContent.jsx` | Uses `WorkspaceLayoutContent` |
| `apps/accounts` | `components/AccountsPageHeader.jsx` | Converted from `WorkspaceHeader` to `AppPageHeader` |

## New shared components

### `TableSortDropdown`
```jsx
import { TableSortDropdown } from '@webfudge/ui';

<TableSortDropdown
  open={sortOpen}
  sortRules={sortRules}
  columnOptions={sortColumnOptions}
  onAddRule={addSortRule}
  onRemoveRule={removeSortRule}
  onSetDirection={setRuleDirection}
  onMoveRule={moveSortRule}
  onClear={clearSort}
/>
```
Renders nothing when `open` is false. Default className positions it `absolute right-0 top-full z-40 mt-2`.

### `AccessDeniedPanel`
```jsx
import { AccessDeniedPanel } from '@webfudge/ui';

// Centered (PM-style)
<AccessDeniedPanel title="Access denied" description="..." />

// Card (CRM-style)
<AccessDeniedPanel variant="card" title="Deals is not available for your role." description="..." />
```

### `WorkspaceLayoutContent`
```jsx
import { WorkspaceLayoutContent } from '@webfudge/ui';

<WorkspaceLayoutContent
  sidebar={MySidebar}
  appName="Webfudge PM"
  pwaStorageKey="pm"
  canView={canView}               // app-specific RBAC result
  deniedTitle="Access denied"
  deniedDescription="..."
  deniedVariant="centered"        // or "card"
  extras={<PMQuickActionsFab />}  // optional; rendered alongside children
>
  {children}
</WorkspaceLayoutContent>
```
Pass `showPwa={false}` to skip the PWA install prompt (e.g. Accounts).
Pass `deniedContent={<CustomNode />}` to completely override the denied UI.

## Shared utils

```js
// Pure data helpers (no UI deps)
import { industryOptions, canonicalIndustryValue, companyTypes, ... } from '@webfudge/utils';
import { contactFieldsFromLeadCompany, contactFieldsFromClientAccount } from '@webfudge/utils';

// Industry icon/theme tokens (needs lucide-react, lives in @webfudge/ui)
import { getIndustryVisual } from '@webfudge/ui/utils/industryVisuals';
```

## App lib files (backward-compatible re-exports)

All existing app-level imports (`../lib/leadCompanyProfileOptions`, `../lib/industryVisuals`, etc.) continue to work — the app lib files are now thin re-exports pointing to the shared packages.

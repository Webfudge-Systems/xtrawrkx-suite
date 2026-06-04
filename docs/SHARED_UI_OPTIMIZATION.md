# Shared UI Optimization — PM & CRM Component Consolidation

## Summary

Identified and extracted all duplicate/reusable UI components from `apps/pm` and `apps/crm` into `packages/ui` (`@webfudge/ui`). The apps now re-export or wrap the shared components instead of maintaining duplicate code.

## Scope

**New shared components added to `packages/ui`:**
- `EntityDetailLayout` — field layout helpers for entity detail pages
- `MeetingsEmbedList` — compact meetings list for entity detail tabs
- `AppPageHeader` — unified `WorkspaceHeader` wrapper for all workspace apps
- `ProgressBar` — generic percentage progress bar

**Apps updated:**
- `apps/pm` — `PMPageHeader`, `PMProgress`, `MeetingsEmbedList`, `pmEntityDetailInfo`, `PMSidebar`
- `apps/crm` — `CRMPageHeader`, `MeetingsEmbedList`, `entityDetailInfo`, `GlobalSearchModal`

## Details

### `packages/ui/components/EntityDetailLayout/`

Merged the identical `apps/pm/components/pmEntityDetailInfo.jsx` and `apps/crm/components/entityDetailInfo.jsx` into one canonical shared module.

**Exports:**
```js
import {
  entityInfoLabelClass,
  InfoSection,
  DetailColumnHeading,
  InfoRow,
  SidebarCardTitle,
} from '@webfudge/ui';
```

Both app files now re-export from `@webfudge/ui`. All existing consumers continue to work without any import changes.

---

### `packages/ui/components/MeetingsEmbedList/`

The PM and CRM versions were byte-for-byte identical. The shared component adds one extra optional prop:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fetchFn` | `() => Promise<{data}>` | — | Data fetcher |
| `scheduleHref` | `string` | — | "Add meeting" button href |
| `emptyTitle` | `string` | `'No meetings yet'` | Empty-state heading |
| `entityLabel` | `string` | `'this record'` | Used in empty-state copy |
| `meetingBasePath` | `string` | `'/meetings'` | Base path for meeting detail links |

Both app files now re-export the default + named export from `@webfudge/ui`.

---

### `packages/ui/components/AppPageHeader/`

Replaces the near-identical `PMPageHeader` and `CRMPageHeader` thin wrappers. Each app still has its own `*PageHeader.jsx` file — but now it's 10 lines instead of 52, simply spreading props and injecting the app-specific `notificationService` and `GlobalSearchModal`.

**Usage (from any app):**
```jsx
import { AppPageHeader } from '@webfudge/ui';

export default function MyAppPageHeader(props) {
  return (
    <AppPageHeader
      {...props}
      notificationService={myNotificationService}
      renderGlobalSearchModal={({ isOpen, onClose, initialQuery }) => (
        <GlobalSearchModal isOpen={isOpen} onClose={onClose} initialQuery={initialQuery} />
      )}
    />
  );
}
```

---

### `packages/ui/components/ProgressBar/`

Generic progress bar extracted from `PMProgress.jsx`. Adds ARIA attributes.

```jsx
import { ProgressBar } from '@webfudge/ui';

<ProgressBar value={72} size="sm" label={false} />
```

`apps/pm/components/PMProgress.jsx` now re-exports `ProgressBar` as default for backwards compatibility.

---

### CRM `GlobalSearchModal` refactor

The CRM search modal was using a local `BaseModal` shell. It has been refactored to use the shared `WorkspaceSearchModal` (same as PM), giving it:
- Consistent glass-morphism overlay appearance
- Shared keyboard shortcut hints in the footer
- Consistent search input styling

The search logic (querying leads, deals, contacts, clients via `globalSearchService`) is unchanged.

---

### PM `PMSidebar` — `SidebarTrialUpsell` added

The CRM sidebar already showed the `SidebarTrialUpsell` banner at the bottom. PM was missing it. It's now added at the bottom of `PMSidebar` with the same `collapsed`, `daysRemaining` (from `NEXT_PUBLIC_TRIAL_DAYS_REMAINING`), and `upgradeHref` props.

---

## Before / After

| What | Before | After |
|------|--------|-------|
| `entityDetailInfo` | Duplicated 75-line file in PM + CRM | Single source in `@webfudge/ui`, both apps re-export |
| `MeetingsEmbedList` | Duplicated 299-line file in PM + CRM | Single source in `@webfudge/ui`, both apps re-export |
| `PMPageHeader` / `CRMPageHeader` | 52-line near-duplicate in each app | 10-line wrapper in each app using shared `AppPageHeader` |
| CRM `GlobalSearchModal` | Custom `BaseModal` + bespoke layout | Unified with `WorkspaceSearchModal` like PM |
| `PMProgress` | 15-line component in PM only | Shared `ProgressBar` in `@webfudge/ui`, PM re-exports |
| PM Sidebar trial upsell | Missing | Added `SidebarTrialUpsell` at sidebar bottom |

## Usage / Migration

All existing imports are backwards-compatible — app components re-export with the same name and default export. No page or feature files need to change their imports.

If a new app (e.g. `apps/books`, `apps/accounts`) needs any of these components, import directly from `@webfudge/ui`:

```js
import {
  AppPageHeader,
  MeetingsEmbedList,
  ProgressBar,
  InfoSection,
  InfoRow,
  SidebarCardTitle,
  DetailColumnHeading,
  entityInfoLabelClass,
} from '@webfudge/ui';
```

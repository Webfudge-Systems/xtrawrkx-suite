# Shared Component Cleanup & Consolidation (June 2026)

## Summary

Audited CRM, PM, and Accounts apps for reusable components that were duplicated or living in the wrong place. Moved chart primitives and UI patterns into `@webfudge/ui`, created a shared `QuickActionsFab`, cleaned up the status badge in Accounts, and added missing `.env.example` files for every app.

---

## Scope

| App / Package | Changes |
|---|---|
| `packages/ui` | New `DashboardCharts/` component group + `QuickActionsFab` component |
| `apps/crm` | CRM `dashboard/shared/` files now re-export from `@webfudge/ui` |
| `apps/pm` | `PMQuickActionsFab` and `DashboardInsightShell` / `DashboardProgressRow` re-export from `@webfudge/ui` |
| `apps/accounts` | User status pills replaced with `Badge` from `@webfudge/ui`; removed local `getStatusClasses` |
| All apps | New or updated `.env.example` files |

---

## 1. Dashboard Charts → `@webfudge/ui`

### What moved

All chart primitives from `apps/crm/components/dashboard/shared/` were promoted to `packages/ui/components/DashboardCharts/`:

| Export | Description |
|---|---|
| `GradientStackedBarChart` | Recharts stacked bar chart (overdue/pending/completed) |
| `DonutChartFrame` + `DonutChartCenterLabel` | Recharts donut layout shell with centered total |
| `DashboardChartPanel` + `DashboardChartEmpty` | Chart card shell (title, icon, loading, brand canvas) |
| `DashboardBarTooltip` + `DASHBOARD_BAR_TOOLTIP_CURSOR` | Recharts bar tooltip |
| `DashboardChartCanvas` + `PRIMARY_ORANGE_SHADES` | Orange gradient chart well + color palette |
| `STACK_SERIES` + `STACK_ORDER` | Stacked bar chart color tokens |
| `DashboardKpiRow` | Grid of `KPICard` widgets |
| `DashboardInsightShell` + `InsightCountBadge` | Compact insight card shell (PM/CRM manager widgets) |
| `DashboardProgressRow` + `progressBarColorForValue` | Avatar + CSS progress bar row |

### How CRM files changed

The `apps/crm/components/dashboard/shared/*.jsx` files now simply re-export from `@webfudge/ui` — no logic was lost, existing imports still work.

### How to use in PM (or any app)

```jsx
import {
  GradientStackedBarChart,
  DonutChartFrame,
  DashboardChartPanel,
  DashboardInsightShell,
  InsightCountBadge,
  DashboardProgressRow,
  DashboardKpiRow,
} from '@webfudge/ui'
```

---

## 2. Quick Actions FAB → `@webfudge/ui`

A shared `QuickActionsFab` base component was added to `packages/ui/components/QuickActionsFab/`.

### API

```jsx
import { QuickActionsFab } from '@webfudge/ui'

<QuickActionsFab
  actions={[
    {
      label: 'New Task',
      icon: CheckSquare,
      onClick: () => router.push('/tasks/new'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    // ...more actions
  ]}
  menuWidth="w-56"  // optional, default "w-52"
/>
```

### Apps updated

- **CRM** — `CRMQuickActionsFab.jsx` now composes `QuickActionsFab` with CRM-specific actions + RBAC filtering
- **PM** — `PMQuickActionsFab.jsx` now composes `QuickActionsFab` with PM-specific actions + RBAC filtering

---

## 3. Accounts User Status — `Badge` from `@webfudge/ui`

Previously `apps/accounts/app/users/page.js` used a local `getStatusClasses` function producing inline Tailwind classes for status pills.

**Before:**
```jsx
function getStatusClasses(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  // ...
}
<span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(status)}`}>
  {status}
</span>
```

**After:**
```jsx
import { Badge } from '@webfudge/ui'

function getUserStatusVariant(status) {
  if (status === 'active') return 'success'
  if (status === 'invited') return 'warning'
  return 'danger'
}
<Badge variant={getUserStatusVariant(status)} className="capitalize">{status}</Badge>
```

---

## 4. ENV Files

Created or updated `.env.example` for every app:

| File | Status |
|---|---|
| `.env.example` (root) | Updated — now a directory guide pointing to each app's own file |
| `apps/crm/.env.example` | Already existed, unchanged |
| `apps/pm/.env.example` | **Created** — was missing |
| `apps/accounts/.env.example` | Already existed, unchanged |
| `apps/backend/.env.example` | Already existed, unchanged |
| `apps/landing/.env.example` | Already existed, unchanged |
| `apps/books/.env.example` | **Created** — was missing (includes Supabase vars) |
| `apps/(automobile)/vlm/.env.example` | **Created** — was missing |

> Copy any app's `.env.example` to `.env.local` inside that app directory to set up local dev. The `.env.local` files are gitignored and excluded from Turbo cache keying.

---

## Migration Notes

- **No breaking changes**: all existing imports in CRM and PM continue working via re-export stubs.
- **Recharts dependency**: `GradientStackedBarChart` and `DonutChartFrame` require `recharts` in the consuming app. CRM already has it. If using these in PM, add `recharts` to `apps/pm/package.json`.
- **QuickActionsFab is `'use client'`**: works in Next.js App Router as long as it's mounted in a client component tree.

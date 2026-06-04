# Wrapper Files Removal

## Summary

Eliminated all thin re-export wrapper files across `apps/pm`, `apps/crm`, and `apps/accounts`. Every page and component that imported from these wrappers now imports directly from `@webfudge/ui` or `@webfudge/utils`. The wrapper files have been deleted.

## Scope

### Deleted wrapper files (15 total)

**apps/pm/components/**
- `PmTableSortDropdown.jsx` → was re-exporting `TableSortDropdown` from `@webfudge/ui`
- `pmEntityDetailInfo.jsx` → was re-exporting `entityInfoLabelClass, InfoSection, DetailColumnHeading, InfoRow, SidebarCardTitle` from `@webfudge/ui`
- `MeetingsEmbedList.jsx` → was re-exporting `MeetingsEmbedList` from `@webfudge/ui`
- `PMProgress.jsx` → was re-exporting `ProgressBar` from `@webfudge/ui`
- `WorkspaceCalendarClient.jsx` → was re-exporting `UnifiedWorkspaceCalendar` (default) from `@webfudge/ui`

**apps/crm/components/**
- `CrmTableSortDropdown.jsx` → was re-exporting `TableSortDropdown` from `@webfudge/ui`
- `entityDetailInfo.jsx` → was re-exporting `entityInfoLabelClass, InfoSection, DetailColumnHeading, InfoRow, SidebarCardTitle` from `@webfudge/ui`
- `MeetingsEmbedList.jsx` → was re-exporting `MeetingsEmbedList` from `@webfudge/ui`
- `WorkspaceCalendarClient.jsx` → was re-exporting `UnifiedWorkspaceCalendar` (default) from `@webfudge/ui`

**apps/pm/lib/**
- `leadCompanyProfileOptions.js` → was re-exporting `*` from `@webfudge/utils`
- `contactCompanyFields.js` → was re-exporting `contactFieldsFromClientAccount, contactFieldsFromLeadCompany` from `@webfudge/utils`
- `industryVisuals.js` → was re-exporting `getIndustryVisual` from `@webfudge/ui/utils/industryVisuals`

**apps/crm/lib/**
- `leadCompanyProfileOptions.js` → was re-exporting `*` from `@webfudge/utils`
- `contactCompanyFields.js` → was re-exporting `contactFieldsFromClientAccount, contactFieldsFromLeadCompany` from `@webfudge/utils`
- `industryVisuals.js` → was re-exporting `getIndustryVisual` from `@webfudge/ui/utils/industryVisuals`

## Updated files

### TableSortDropdown (`@webfudge/ui`)
- `apps/pm/app/my-tasks/page.js`
- `apps/pm/app/clients/accounts/page.js`
- `apps/pm/app/projects/page.js`
- `apps/pm/components/ProjectTasksPanel.jsx`
- `apps/crm/app/sales/contacts/page.js`
- `apps/crm/app/sales/lead-companies/page.js`
- `apps/crm/app/sales/deals/page.js`

### EntityDetail components (`@webfudge/ui`)
- `apps/pm/app/projects/[slug]/page.js`
- `apps/pm/app/tasks/[id]/page.js`
- `apps/crm/app/clients/invoices/[id]/page.js`
- `apps/crm/app/clients/proposals/[id]/page.js`

### MeetingsEmbedList (`@webfudge/ui`)
- `apps/pm/app/clients/accounts/[id]/page.js`
- `apps/crm/app/sales/deals/[id]/page.js`
- `apps/crm/app/sales/lead-companies/[id]/page.js`
- `apps/crm/app/clients/accounts/[id]/page.js`

### ProgressBar / PMProgress (`@webfudge/ui`)
- `apps/pm/app/projects/page.js`
- `apps/pm/components/ProjectsKanbanBoard.jsx`

### UnifiedWorkspaceCalendar dynamic import (`@webfudge/ui`)
- `apps/pm/app/calendar/page.js`
- `apps/crm/app/calendar/page.js`

### leadCompanyProfileOptions (`@webfudge/utils`)
- `apps/pm/app/clients/accounts/[id]/page.js`
- `apps/pm/app/clients/accounts/[id]/edit/page.js`
- `apps/pm/app/clients/accounts/new/page.js`
- `apps/crm/app/sales/lead-companies/[id]/page.js`
- `apps/crm/app/sales/lead-companies/[id]/edit/page.js`
- `apps/crm/app/sales/lead-companies/new/page.js`
- `apps/crm/app/clients/accounts/[id]/page.js`
- `apps/crm/app/clients/accounts/[id]/edit/page.js`
- `apps/crm/app/clients/accounts/new/page.js`

### contactCompanyFields (`@webfudge/utils`)
- `apps/pm/app/clients/accounts/new/page.js`
- `apps/crm/app/sales/contacts/[id]/edit/page.js`
- `apps/crm/app/sales/contacts/new/page.js`
- `apps/crm/app/clients/accounts/new/page.js`

### getIndustryVisual (`@webfudge/ui/utils/industryVisuals`)
- `apps/pm/app/clients/accounts/[id]/page.js`
- `apps/crm/app/clients/accounts/[id]/page.js`

## Import patterns used

| Before | After |
|--------|-------|
| `import PmTableSortDropdown from '...components/PmTableSortDropdown'` | `import { TableSortDropdown as PmTableSortDropdown } from '@webfudge/ui'` |
| `import CrmTableSortDropdown from '...components/CrmTableSortDropdown'` | `import { TableSortDropdown as CrmTableSortDropdown } from '@webfudge/ui'` |
| `import PMProgress from '...components/PMProgress'` | `import { ProgressBar as PMProgress } from '@webfudge/ui'` |
| `import MeetingsEmbedList from '...components/MeetingsEmbedList'` | `import { MeetingsEmbedList } from '@webfudge/ui'` |
| `import { InfoRow, ... } from '...components/pmEntityDetailInfo'` | `import { InfoRow, ... } from '@webfudge/ui'` |
| `import { ... } from '...lib/leadCompanyProfileOptions'` | `import { ... } from '@webfudge/utils'` |
| `import { ... } from '...lib/contactCompanyFields'` | `import { ... } from '@webfudge/utils'` |
| `import { getIndustryVisual } from '...lib/industryVisuals'` | `import { getIndustryVisual } from '@webfudge/ui/utils/industryVisuals'` |
| `dynamic(() => import('...WorkspaceCalendarClient'))` | `dynamic(() => import('@webfudge/ui').then(m => ({ default: m.UnifiedWorkspaceCalendar })))` |

# CRM Dashboard Multi-View RBAC

## Summary

The CRM dashboard (`/`) provides three client-side views switched without page reload: **Personal** (default), **Sales** (Admin), and **Manager** (Admin / Manager). Each view reuses existing card widgets and adds modular chart panels backed by `dashboardDataService.js`.

## Scope

| Area        | Files                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page shell  | `apps/crm/app/page.js`                                                                                                                           |
| View access | `apps/crm/lib/dashboardViews.js`                                                                                                                 |
| Data layer  | `apps/crm/lib/api/dashboardDataService.js`, `teamPerformanceService.js`                                                                          |
| Views       | `components/dashboard/views/*.jsx`                                                                                                               |
| Widgets     | `components/dashboard/*`, `sales/SalesExtendedAnalytics.jsx`, `sales/SalesProposalsWidget.jsx`, `sales/SalesInvoicesWidget.jsx`, `manager/*.jsx` |
| Shared UI   | `components/dashboard/shared/DashboardChartPanel.jsx`, `DashboardKpiRow.jsx`                                                                     |
| FAB         | `components/CRMQuickActionsFab.jsx` (New Task, Meeting, Lead, Proposal)                                                                          |

## Personal view

- **KPIs:** My open tasks, overdue tasks, meetings today, assigned leads
- **Sections:** Upcoming meetings, latest assigned leads, My work, recent activity feed
- **No** revenue/pipeline/sales charts

## Sales view

- **KPIs:** Total leads, pipeline value, conversion rate, active deals (4 cards)
- **Sales Analytics:** `SalesAnalyticsWidget` — revenue, conversion, velocity KPIs plus revenue trend and deals-by-stage charts (full width, above the grid)
- **Top row:** `xl:grid-cols-3` equal-height row — sales funnel, pipeline aging, lead sources (`dashboardRow` styling)
- **Second row:** proposals and invoices side-by-side (`lg:grid-cols-2`, full width below the chart row)
- **Graph + table widgets (left):** `SalesProposalsWidget`, `SalesInvoicesWidget` — pill tabs (Graph | Table), matching Manager task-distribution pattern
- **Removed from sales view:** latest leads list (`LatestLeadsWidget`), top sales members chart (not shipped)

## Manager view

- **KPIs:** Team open/overdue tasks, meetings today, active team members
- **Sections:** Team workload (`TeamPerformanceWidget` — click a row for full performance modal), task distribution (stacked bar), lead assignment (donut), team activity feed, meetings, leads assigned
- **Team member modal:** `TeamMemberPerformanceModal` — date range filter, KPIs, pill tabs (Tasks / Leads / Deals / Report) using `TabsWithActions`, `Modal`, `Table`, `KPICard`
- **Excluded:** Revenue, deals analytics, proposals/invoices financial charts

## Usage

Use the header pill control to switch views. Preference is stored in `localStorage` (`crm.dashboard.view`).

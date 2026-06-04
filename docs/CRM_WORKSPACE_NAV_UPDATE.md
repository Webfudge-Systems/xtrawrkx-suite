# CRM navigation: Communication → Workspace

## Summary

The former **Communication** area is renamed to **Workspace** and expanded. **Hub** and **Email** were removed from the sub-menu. **Proposals** and **Tasks** appear under **Workspace** (URLs remain under `/clients/…`). **Invoices** are listed under **Clients** next to accounts and projects. **Meetings** and **Documents** were added (currently **Coming soon** via `/coming-soon`).

## Scope

- `apps/crm/lib/navigation.js` — `navigationData` + `mainNavItems`
- `apps/crm/components/CRMSidebar.jsx` — duplicated nav config + active-state rules
- `apps/crm/app/workspace/page.js` — new overview hub
- `apps/crm/app/communication/page.js` — removed; `/communication` redirects to `/workspace` in `apps/crm/next.config.js`
- `apps/crm/app/threads/page.js` — breadcrumb parent label/href

## Routes

| Path | Role |
|------|------|
| `/workspace` | Workspace overview (cards) |
| `/communication` | 302 → `/workspace` |
| `/threads`, `/activities`, `/clients/proposals`, `/clients/tasks` | Unchanged URLs; highlighted under **Workspace** when active |
| `/clients/invoices` (and sub-routes) | Unchanged URLs; highlighted under **Clients** when active |
| Coming soon | Meetings, Documents → `/coming-soon?feature=…` |

## Clients sub-menu

**Clients** lists **Client Accounts**, **Invoices**, and **Projects**.

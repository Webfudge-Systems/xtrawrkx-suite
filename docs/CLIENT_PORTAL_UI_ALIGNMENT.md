# Client Portal UI Alignment

## Summary

Aligned the Client Portal visual system with CRM, PM, and Accounts: shared `@webfudge/ui` components, brand orange (`#F5630F` / `brand-primary`), and consistent page shells.

## Scope

- `apps/xtrawrkx-client-portal/`
  - `src/components/layout/PortalPageShell.jsx` (new)
  - `src/components/ui/PageHeader.jsx` — uses shared `Card`, `workspaceSearchInputClassName`, brand tokens
  - `src/components/layout/Sidebar.jsx` — `SidebarProductBranding`, orange active states
  - Protected pages: dashboard, tasks, messages, projects, communities
  - `src/styles/globals.css` — white body, orange CSS primary tokens
  - `src/app/layout.jsx` — theme color `#F5630F`

## Details

### Shared components

| Before | After |
|--------|--------|
| Local glass KPI cards | `@webfudge/ui` `KPICard` |
| Local `Card` on key pages | `@webfudge/ui` `Card` |
| Pink `xtrawrkx-500` accents | `brand-primary` / orange scale |
| Ad-hoc `px-4 pt-4` wrappers | `PortalPageShell` (`p-4 md:p-6 space-y-4`) |
| Plain "Client Portal" sidebar title | `SidebarProductBranding` |

### Page header

`PageHeader` keeps client-portal `useSession` auth but matches `WorkspaceHeader` typography (glass `Card`, brand breadcrumbs, orange avatar gradient, workspace search input).

### Not changed

- Custom `MainLayout` (portal auth vs `@webfudge/auth` `AppShell`)
- Chat bubble gradients (functional; can be aligned in a follow-up)
- `projects/[id]` detail page (partial legacy styling)
- `TaskDetailModal` (detail drawer — still custom shell; create modals use shared `Modal`)

## Modals & search (latest)

- **Search:** `PageHeader` uses `WorkspaceSearchInput` (icon + `pl-10` padding — fixes overlap)
- **Create Task / Create Project:** `@webfudge/ui` `Modal`, `Input`, `Select`, `Textarea`, `Button` (orange primary, no pink gradient)
- **Community join:** shared `Modal` + `Button`
- Local `@/components/ui/Modal` re-exports `@webfudge/ui` `Modal`

## Tables, Column Picker & View Toggles (latest)

Aligned list pages (`/tasks`, `/projects`) with the PM `my-tasks` pattern:

| Feature | Before | After |
|---------|--------|-------|
| Toolbar variant | `variant="modern"` (gray border card) | `variant="glass"` (white/40 subtle glass) |
| View toggle | `showViewToggle` built-in buttons | `ViewToggleGroup` + `ViewToggleButton` via `afterTabs` |
| Column picker | None | `TableColumnPicker` with `useTableColumnPreferences` hook |
| Table variant | `variant="modern"` | `variant="modernEmbedded"` (no outer card) |
| Column resizing | None | `{...tableResizeProps}` from hook |
| Column visibility | All columns always visible | Per-column `visibilityKey`, toggle & reorder via picker |
| Table cells | Custom inline divs | `TableCellTitleSubtitle`, `TableCellCreated`, `TableCellTaskStatus`, `TableCellProjectStatus` |

### Column storage keys
- Tasks: `portal.tasks.tableColumnVisibility`, `portal.tasks.tableColumnOrder`, `portal.tasks.tableColumnWidths`
- Projects: `portal.projects.tableColumnVisibility`, `portal.projects.tableColumnOrder`, `portal.projects.tableColumnWidths`

### Tab bar — no border on pill track
Added `noPillTrackBorder` prop to `TabsWithActions` in `@webfudge/ui`. Pass it on detail pages using `variant="pill"` to remove the `border border-gray-200` from the pill track shell.

## Usage

New protected pages should wrap content in `PortalPageShell` and use `PageHeader` + shared UI primitives from `@webfudge/ui`.

For list pages with tables:
1. Define `TOGGLEABLE_COLUMNS` and `DEFAULT_COLUMN_WIDTHS` constants above the component.
2. Call `useTableColumnPreferences` and pass storage keys + defaults.
3. Wrap `TabsWithActions` in `<div className="relative" ref={toolbarRef}>` and add `<TableColumnPicker>` below it.
4. Use `variant="glass"` on `TabsWithActions` and pass `ViewToggleGroup`/`ViewToggleButton` as `afterTabs`.
5. Use `variant="modernEmbedded"` on `Table` and spread `{...tableResizeProps}`.

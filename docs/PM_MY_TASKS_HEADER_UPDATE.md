# PM My Tasks Header Update

## Summary
Updated the PM “My Tasks” page header to match the same layout pattern used on the PM Projects page: breadcrumb + inline search + icon-style actions, using `@webfudge/ui` components.

## Scope
- `apps/pm/app/my-tasks/page.js`

## What changed
- `PMPageHeader` now receives:
  - `breadcrumb`: `Dashboard > My Tasks`
  - `showSearch` + `onSearchChange` for filtering
  - `showActions` with:
    - `onAddClick` -> opens New Task modal
    - `onFilterClick` -> opens filter drawer
- Disabled duplicate search/add/filter controls inside `TabsWithActions` so only the header owns them.


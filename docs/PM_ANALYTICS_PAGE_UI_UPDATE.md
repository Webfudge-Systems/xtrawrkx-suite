# PM Analytics Page UI Update

## Summary
Updated the PM `Analytics` page UI to match the reference layouts:
- When there are **0 tasks**, the page shows the two “breakdown” cards (`Task Status Breakdown` + `Task Priority Breakdown`) with the “No tasks yet” empty visuals.
- When there are **tasks available**, the page shows four analytics cards (`Tasks by Status`, `Tasks by Project`, `Tasks by Assignee`, `Task Completion Over Time`) with consistent `@webfudge/ui` card styling.

## Scope
- App: `apps/pm/app/analytics/page.js`
- UI components used for consistency:
  - `KPICard` (top KPI grid)
  - `Card` (analytics cards, using `glass={true}`)

## Details
### Header + breadcrumb alignment
- Added breadcrumb: `Dashboard > Analytics`.
- Subtitle now changes based on whether tasks exist:
  - Empty state: `Project and task performance overview`
  - Non-empty state: `Analyze and manage your projects and tasks`

### Chart cards behavior
**0 tasks state**
- Shows only two cards in the chart grid:
  - `Task Status Breakdown`
  - `Task Priority Breakdown`
- Both cards use a centered “No tasks yet” visual.

**Non-empty state**
- Shows four cards:
  - `Tasks by Status` (blue `To Do` vs green `Done` blocks)
  - `Tasks by Project` (two colored bars + legend in the card actions area)
  - `Tasks by Assignee` (user icons + vertical lines)
  - `Task Completion Over Time` (stacked filled area via inline SVG + legend)

## How to verify
1. Open the PM Analytics page (`/analytics`).
2. Check the layout when tasks are present vs when tasks are empty.
3. Confirm breadcrumb and card headers/actions match the reference screenshots.


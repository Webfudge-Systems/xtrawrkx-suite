# PM Add Project Form Update

## Summary
Updated the PM `Add New Project` page to match the reference form layout and labels with consistent `@webfudge/ui` components.

## Scope
- `apps/pm/app/projects/add/page.js`

## What Changed
- Header aligned to reference:
  - Title: `Add New Project`
  - Subtitle: `Create a new project and assign team members`
  - Removed breadcrumb in header for this page.
- Project Information section:
  - Section title + subtitle + icon badge
  - Fields reordered to: `Project Name` + `Status` (same row), then `Project Description`
- Project Timeline section:
  - Section title + subtitle + icon badge
  - Labels normalized to `Start Date` and `End Date`
- Budget & Assignment section:
  - Renamed from `Assignment` to `Budget & Assignment`
  - Added `Budget` input
  - Kept `Client` and `Project Manager` selectors
- Status options updated to project-oriented states:
  - `Planning`, `Active`, `In Progress`, `On Hold`, `Completed`, `Cancelled`
  - Default form status set to `Planning`

## Notes
- Budget is submitted as a number when provided, else `null`.
- Existing team member selection and submit/cancel behavior remain intact.


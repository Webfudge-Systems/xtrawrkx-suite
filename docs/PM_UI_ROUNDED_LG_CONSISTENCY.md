# PM UI: `rounded-lg` for controls

## Summary

Interactive controls in the PM app and shared `@webfudge/ui` primitives now use **Tailwind `rounded-lg`** (8px) for a consistent “square with rounded corners” shape: header search, sidebar search, tab bars with actions, icon buttons, and default `Button` corners.

## Scope

- **`packages/ui`**: `Button` default radius (`rounded-md` → `rounded-lg`), `PageHeader`, `Tabs` (modern/glass tab buttons + shell), `TabsWithActions` (container, tabs, search field, action buttons — icon buttons use `rounded-lg` instead of `rounded-full`).
- **`apps/pm`**: `PMPageHeader`, `PMSidebar`, `GlobalSearchModal`, and PM routes updated for search fields, buttons, tab shells, and related controls.

## Unchanged

- **Colors, borders, and typography** were not intentionally changed.
- **Pill/circle affordances** kept where they are not rectangular controls: e.g. tab count badges (`rounded-full`), notification dots, progress bars, status pills.
- **Large static shells** (e.g. white table/card wrappers, alert banners) mostly left as `rounded-xl` where they are layout containers, not primary buttons or search inputs.

## Usage

- Prefer **`Button`** from `@webfudge/ui` for actions; default rounding is `rounded-lg`.
- For custom `<button>` / `<input>` in PM, align with **`rounded-lg`** for the same visual language.

## Empty states (no data)

`EmptyState` and `TableEmptyBelow` in `@webfudge/ui` use a shared pattern: **semibold `text-base` title** (`text-gray-900`), **smaller gray subtitle** (`text-sm text-gray-500`) with `mt-1.5`, optional **muted icon** above, and optional **action** with `mt-6`. PM list pages (My Tasks, Projects, project detail, dashboard widgets, inbox, global search hints) follow this for consistency.

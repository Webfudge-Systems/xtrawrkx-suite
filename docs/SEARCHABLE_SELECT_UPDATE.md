# Searchable Select Update

## Summary

The shared `@webfudge/ui` `Select` component now supports a searchable dropdown with a fixed maximum list height and internal scrolling. Long option lists (e.g. clients, projects) no longer expand to full browser-native height.

## Scope

- `packages/ui/components/Select/Select.jsx`
- PM: project client fields, task project field (`TaskDetailsCard`, `QuickCreateTaskModal`)

## Details

- When `searchable` is `true`, or when there are **8+** options, `Select` renders a custom combobox instead of a native `<select>`.
- The menu includes a search field at the top and a scrollable list (`max-h-52` by default, ~6–7 rows).
- Click outside or **Escape** closes the menu and clears the filter.
- Short lists (status, priority, etc.) keep the native `<select>` unless `searchable` is set explicitly.

### Props

| Prop | Description |
|------|-------------|
| `searchable` | Force searchable UI (`true`) or native select (`false`). Default: auto when `options.length >= 8`. |
| `searchPlaceholder` | Placeholder for the filter input (default: `Search…`). |
| `listMaxHeight` | Tailwind max-height class for the options list (default: `max-h-52`). |

## Usage

```jsx
<Select
  label="Client"
  value={clientId}
  options={clientOptions}
  onChange={setClientId}
  searchable
  searchPlaceholder="Search clients…"
/>
```

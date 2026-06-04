# Modal `navPanel` variant — Books & CRM sub-navigation

## Summary

`@webfudge/ui` `Modal` now supports `variant="navPanel"` for right-docked module navigation (gray header, white list body, back + close, shared shadow/rounded treatment). Books and CRM sub-sidebars use this variant so behavior and visuals stay aligned.

Default modals now render `subtitle` under the title when provided (e.g. Configure Features).

## Scope

- `packages/ui/components/Modal/Modal.jsx` — `navPanel`, `onBack`, subtitle in default header
- `apps/books/components/layout/SubSidebar.tsx` — uses `Modal` `navPanel`
- `apps/books/components/layout/Sidebar.tsx` — imports shared `SubSidebar` (removed inline duplicate)
- `apps/crm/components/SubSidebar.jsx` — same `Modal` `navPanel` pattern

## Usage

```jsx
<Modal
  isOpen={open}
  onClose={onClose}
  variant="navPanel"
  title="Sales"
  subtitle="Navigation"
  contentClassName="space-y-2"
>
  {/* links */}
</Modal>
```

Optional `onBack` overrides the back button (defaults to `onClose`).

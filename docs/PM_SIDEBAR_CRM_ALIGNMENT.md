# PM Sidebar – CRM UI Alignment

## Summary

The PM app sidebar (`apps/pm/components/PMSidebar.jsx`) was updated to match the CRM sidebar (`apps/crm/components/CRMSidebar.jsx`) visually and structurally: same shell (width, blur, borders, shadow), header + search + Quick Actions treatment, glass-style main nav grid, collapsible Tools inside `@webfudge/ui` `Card` with `variant="glass"`, and a glass `Card` footer with `Avatar` from `@webfudge/ui`. `LoadingSpinner` is used for the projects list loading state.

## Scope

- **App:** `apps/pm`
- **Key file:** `components/PMSidebar.jsx`
- **UI package:** `Card`, `Avatar`, `LoadingSpinner` from `@webfudge/ui`

## Details

- **Removed:** `aside` + `border-brand-border` layout, separate floating expand control, plain footer with `LogOut`, and standalone Analytics row (Analytics is now under Tools).
- **Aligned with CRM:** Quick Actions gradient button, dropdown with “Quick Create” and colored icon tiles, main grid `p-4` / `gap-3` / `rounded-xl` glass tiles, projects block styled like CRM “Latest Conversations” (optional orange highlight when on `/projects`), Tools header with `Target` + `ChevronDown`, footer user row with CRM-style `Avatar` and trailing `ChevronDown`.
- **Collapsed mode:** Toggle uses `ChevronRight` / `ChevronLeft` in the header (same as CRM); compact tool icon links when the rail is narrow.

## Usage / migration

No config changes. Sign-out is no longer on the sidebar footer (CRM does not expose it there); use your auth flow elsewhere if required.

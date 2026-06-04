# Books Home — Getting Started / Announcements / Recent Updates

## Summary
The Dashboard home page (`/home`) secondary tabs now use full layouts aligned with the reference: **Getting Started** is an onboarding hub (hero, overview card, setup task grid, advanced links, highlights, support); **Announcements** and **Recent Updates** use a minimal empty state: one centered main icon (megaphone / history) plus heading and description.

## Scope
- `apps/books/app/(dashboard)/home/page.tsx` — `Tabs` uses `variant="default"` (orange active underline, gray inactive) and wires new panels.
- `apps/books/app/(dashboard)/home/components/BooksGettingStartedPanel.tsx`
- `apps/books/app/(dashboard)/home/components/BooksAnnouncementsPanel.tsx`
- `apps/books/app/(dashboard)/home/components/BooksRecentUpdatesPanel.tsx`

## UI
- Built with `@webfudge/ui` (`Tabs`, `Card`, `Button`); Lucide icons for visuals.
- Styling follows existing Books/CRM patterns (orange primary, soft gradients, rounded cards).

## Notes
- Setup task buttons link to relevant Books routes (placeholders where modules are still UI-only).
- Announcements / Recent Updates are static empty states until backend feeds exist.

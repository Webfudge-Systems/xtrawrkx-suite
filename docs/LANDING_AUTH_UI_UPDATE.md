# Landing Auth UI Update

## Summary

Redesigned the xtrawrkx landing site sign-in / sign-up experience (`/auth`) as a full-viewport split layout without the main site navbar or footer.

## Scope

- `apps/landing/app/(auth)/` — dedicated route group and layout (no Navbar/Footer)
- `apps/landing/app/(auth)/auth/page.jsx` — auth page entry
- `apps/landing/src/components/auth/AuthForm.jsx` — full-width page layout + form UX polish

Removed: `apps/landing/app/(primary)/auth/page.jsx` (moved to `(auth)` group).

## Details

### Layout

- **Before:** Auth lived under `(primary)` layout with Navbar + Footer, centered card with `max-w-[1240px]`, top padding for fixed navbar.
- **After:** Auth uses `(auth)` layout with only `PublicAuthProvider` + `ClientLayout`. Page fills the viewport edge-to-edge.

### UI/UX

- Fixed left brand panel (~42% width on desktop) with mountain video, logo link home, and feature highlights.
- Scrollable right form panel with wider `max-w-2xl` content area for multi-step signup.
- Mobile: compact header with logo + “Back to site”; brand panel stacks above the form.
- Clear **Sign in / Register** toggle, password show/hide, desktop “Back to site” control.
- Modal usage of `AuthForm` (`isPage={false}`) unchanged in card layout for embedded contexts.

## Usage

- Sign up: `/auth` or `/auth?mode=signup`
- Sign in: `/auth?mode=login`
- Post-auth redirect remains `/profile` (handled in `AuthForm`).

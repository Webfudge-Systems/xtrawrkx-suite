# Client Portal: Complete Profile + Settings Navigation

## Summary
This update adds a new **Complete Profile** page to the Client Portal and wires the user header dropdown so:
- **Complete Profile** opens the new profile page (`/profile`)
- **Settings** opens the existing settings page (`/settings`)

It also standardizes the new page’s UI by using the same shared layout/header/cards patterns as the rest of the portal.

## Scope
- App routes
  - `apps/xtrawrkx-client-portal/src/app/(protected)/profile/page.jsx` (new)
  - Existing settings route: `apps/xtrawrkx-client-portal/src/app/(protected)/settings/page.jsx`
- Shared UI navigation
  - `apps/xtrawrkx-client-portal/src/components/ui/PageHeader.jsx` (dropdown buttons)

## Details
- Created **`/profile`** page that displays:
  - Personal details (primary contact + bio)
  - Company details (company overview, address, links/interests, company description)
  - A contacts list for all people associated with the organization
- Added:
  - Full-width **profile completion** progress bar
  - **Edit / Save / Cancel** inline editing mode (toggles from the “Complete Profile” / “Edit Profile” action)
  - Action buttons on the page header area:
    - Open website
    - View events
    - Go to settings
    - Go to company
  - Backend persistence for profile updates via:
    - `PUT /auth/update-profile` (stores edited company + personal details in `onboardingData` and updates primary contact fields)
- Updated the user dropdown in **`PageHeader`**:
  - Replaced navigation for the **profile** button to route to `/profile`
  - Replaced navigation for the **settings** button to route to `/settings`

## Usage / Migration
- After signing in, use the top-right dropdown:
  - Click **Complete Profile** to view your full organization + personal details.
  - Click **Settings** to manage notification/security/appearance/language preferences.


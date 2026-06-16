# Client Portal Support Team Card Update

## Summary
Updated the client portal sidebar “Support Team” card styling to use a CRM-like orange gradient, and updated the card UI to switch from “POC pending” to an assigned-POC state when a dedicated POC is available.

## Scope
- `apps/xtrawrkx-client-portal/src/components/layout/SupportAssistanceCard.jsx`
- `apps/xtrawrkx-client-portal/src/components/layout/Sidebar.jsx`

## Details
- The card now supports an optional `poc` prop:
  - When no POC exists: shows `POC pending` + `Yet to assign`.
  - When a POC exists: shows `Active POC` (or away), and updates contact display accordingly.
- Sidebar now always renders `SupportAssistanceCard` and passes the POC data instead of swapping to a different card component.

## Usage / Verification
1. Open the client portal sidebar.
2. With no dedicated POC assigned, confirm the card shows `POC pending` and `Yet to assign`.
3. After POC assignment, confirm the card updates to the assigned-POC UI (gradient + active/away badge).


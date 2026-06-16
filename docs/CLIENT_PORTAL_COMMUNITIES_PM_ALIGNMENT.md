# Client Portal Communities Page — PM Alignment

## Summary

The client portal **Communities** list page (`/communities`) was rebuilt to match the PM/portal list pattern used on Tasks and Projects: shared `@webfudge/ui` toolbar, KPI row, gallery + table views, and live Strapi/event data instead of hardcoded counts.

## Scope

- `apps/xtrawrkx-client-portal/src/app/(protected)/communities/page.jsx`
- `apps/xtrawrkx-client-portal/src/lib/api/communityProgramService.js`
- `apps/backend/src/api/community-membership/controllers/community-membership.js`
- `apps/backend/src/api/community-membership/routes/00-custom-community-membership.js`

## UI / UX

- **Header**: title + subtitle only (`showActions={false}`) — Add and Filter removed.
- **Toolbar**: `TabsWithActions` (`variant="glass"`) with tabs: All, My communities, Pending approval, Discover.
- **Views**: `ViewToggleGroup` with **Gallery** (`LayoutGrid`) and **Table** (`Table2`) only — list view and filter drawer removed.
- **KPIs**: Network members, My communities, Pending approval, Events this month.
- **Gallery**: `Card` grid with join / view actions and status badges.
- **Table**: `Table` with community, division, status, live member count, your access tier, actions.

## Data

| Field | Source |
|-------|--------|
| Program metadata (name, description, tags, division) | `communitiesCatalog.js` (static program definitions) |
| Member / pending status | `listActiveMembershipsForClient`, `listSubmissionsForClient` |
| Member counts per program | `GET /api/community-memberships/program-stats` |
| Events this month | `fetchWebsiteEventsCatalog()` (website proxy) |
| User tier label (XEN) | Membership `membershipData.tier` via `getXenTierByCode` |

Join flow unchanged: `CommunityJoinRequirementsModal` → `community-submissions/join`.

## Backend

New route:

```
GET /api/community-memberships/program-stats
```

Returns `{ byCommunity: { XEN, XEVFIN, XEVTG, XDD }, total }` for ACTIVE memberships.

Restart Strapi after deploy so the route is registered.

## Usage

- Gallery is the default view; switch to table for dense scanning.
- Tabs filter by membership state; search matches name, description, division, and tags.
- Direct join links (`/communities?join=1`) still open the join modal when eligible.

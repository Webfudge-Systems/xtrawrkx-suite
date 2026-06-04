# CRM Activity log page

## Summary

The CRM includes a full **Activity log** at **`/activities`** that lists all `crm-activity` rows for the active organization (newest first), with pagination and links to the related contact, lead company, or deal record.

## Scope

| Layer | Details |
|-------|---------|
| Page | `apps/crm/app/activities/page.js` |
| UI | `ActivitiesTimeline` with optional `entityHrefForRow` for “Open record” links |
| API | `GET /api/crm-activities/feed?limit=&start=` — `limit` max **100**, `start` = offset |
| Client | `fetchGlobalActivityFeed({ limit, start })` in `apps/crm/lib/api/crmActivityService.js` |
| Navigation | Sidebar **Latest activity** → **Full log**; **Communication** sub-sidebar → **Activity log** |

## Usage

- Page size is **25** rows; pagination uses `meta.total` from the feed response.
- **Refresh** re-fetches the current page without changing the page index.

# Threads Page Update

## Summary

The `/threads` page has been rebuilt from a placeholder (empty state) into a fully functional two-panel conversation hub. It aggregates all comment threads from across the CRM — deals, leads, contacts, and client accounts — into a single unified view. Users can browse threads, read conversations, and post new replies without navigating away.

## Scope

- **Backend:** `apps/backend/src/api/crm-activity/controllers/crm-activity.js`
- **CRM frontend:** `apps/crm/app/threads/page.js`
- **CRM service:** `apps/crm/lib/api/crmActivityService.js`

## Details

### Backend: `?type=` filter on the feed endpoint

The `GET /crm-activities/feed` endpoint now accepts an optional `?type=` query parameter. When `type=comment` is passed, only `action: 'comment'` records are returned. All existing behavior without the param is unchanged.

```
GET /crm-activities/feed?type=comment&limit=100
→ { data: [...comments], meta: { total, start, limit } }
```

### Service: `fetchGlobalCommentsFeed`

A new named export added to `crmActivityService.js`:

```js
fetchGlobalCommentsFeed({ limit = 100, start = 0 })
// → { data, total, start, limit }
```

It wraps `fetchGlobalActivityFeed` with `type: 'comment'`. Existing callers are unaffected.

### Frontend: Two-panel threads page

**Left panel — Thread list:**
- Fetches all org-wide comments via `fetchGlobalCommentsFeed`
- Groups comments by entity (`subjectType + subjectId`) to form "threads"
- Sorted by most recently active thread
- Shows entity icon (color-coded by type), entity name, last message preview, participant avatars, message count
- Live search across entity names, message content, and participant names
- Filter pills to narrow by type: All / Leads / Deals / Contacts / Clients
- Refresh button with spinner

**Right panel — Chat:**
- Loads the full comment history for the selected thread via the entity-specific `fetch*Comments` function
- Chronological display (oldest first) with date dividers
- Hover actions on each message: emoji reactions (local), pin message
- Pinned message banner
- In-panel search to filter messages
- "Open record" link to navigate to the entity detail page
- Composer with auto-resizing textarea, Ctrl+Enter shortcut, character counter
- Sending a new message updates both the chat panel and the thread list count in real time

**Entity type configuration** is centralized in a `ENTITY_CONFIG` map keyed by `subjectType`:

| subjectType    | Label   | Color  | Route                        |
|----------------|---------|--------|------------------------------|
| lead_company   | Lead    | violet | `/sales/lead-companies/:id`  |
| deal           | Deal    | emerald| `/sales/deals/:id`           |
| contact        | Contact | sky    | `/sales/contacts/:id`        |
| client_account | Client  | orange | `/clients/accounts/:id`      |

## Usage / Migration

No migration needed. The threads page is accessible at `/threads` from the sidebar (Communication → Threads) and from the Communication hub card. All existing entity-level chat functionality (EntityActivityPanel) is unchanged.

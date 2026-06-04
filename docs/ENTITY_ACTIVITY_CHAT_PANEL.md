# Entity Activity Panel & Chat System

## Summary

Added a rich, dual-tab **Activity + Chat panel** to the Activities tab of all four CRM detail pages (Lead Company, Contact, Deal, Client Account). The chat system is fully linked to the existing hover-chat on list/table pages — they share the same underlying `crm-activity` records with `action: 'comment'`.

## Scope

### Backend
- `apps/backend/src/api/crm-activity/controllers/crm-activity.js` — Extended to support `contactId` and `clientAccountId` in `timeline`, `addComment`, and `commentCounts` endpoints.

### Frontend Service
- `apps/crm/lib/api/crmActivityService.js` — Added `fetchContactComments`, `addContactComment`, `fetchContactCommentCounts`, `fetchClientAccountComments`, `addClientAccountComment`, `fetchClientAccountCommentCounts`.

### New Component
- `@webfudge/ui` `EntityActivityPanel` — Reusable right-side panel with 2 sub-tabs.

### Updated Detail Pages
- `apps/crm/app/sales/lead-companies/[id]/page.js`
- `apps/crm/app/sales/contacts/[id]/page.js`
- `apps/crm/app/sales/deals/[id]/page.js`
- `apps/crm/app/clients/accounts/[id]/page.js`

---

## Details

### Layout Change

The Activities tab now renders a **2-column grid** layout:
- **Left column (2/5 width)**: Activity Summary card — total events, last activity, key stats
- **Right column (3/5 width)**: `EntityActivityPanel` — sub-tabbed Activity Timeline + Chats

This keeps the content right-of-center, not full-width, as requested.

### EntityActivityPanel Features

**Activity sub-tab:**
- Renders the existing `ActivitiesTimeline` component
- Shows event count badge on the tab
- "Open Chats →" quick link

**Chats sub-tab:**
- Message list grouped by date (Today / Yesterday / date)
- Sender avatars with deterministic gradient colors per user
- Hover actions: emoji reactions (8 emojis), pin message, reply (UI)
- Pinned message banner
- Message search with result count
- Scroll-to-bottom button when far from latest
- Online/active status indicator
- Character counter (5000 char limit)
- Auto-resizing textarea composer
- `Ctrl+Enter` keyboard shortcut to send
- Error state with retry

### Data Model

Chat messages use the existing `crm-activity` collection with:
```json
{ "action": "comment", "subjectType": "<entity_type>", "subjectId": <id>, "meta": { "comment": "<text>" } }
```

| Entity | subjectType | Backend support |
|--------|-------------|-----------------|
| Lead Company | `lead_company` | ✅ pre-existing |
| Deal | `deal` | ✅ pre-existing |
| Contact | `contact` | ✅ newly added |
| Client Account | `client_account` | ✅ newly added |

### Linked to Table Hover Chat

The table-level hover chat popover (on Lead Companies and Deals list pages) already uses `addLeadCompanyComment` / `addDealComment`. The `EntityActivityPanel` on detail pages uses the **same backend endpoint and same data** — messages sent from either place are visible in both.

---

## Usage / Migration

No migration needed. All new chat messages use the existing `crm_activities` table.

**Restart backend** after this change to ensure the updated controller is loaded.

After restart, the Activities tab on all 4 detail pages will show:
1. A compact summary card on the left
2. The dual-tab panel (Activity Timeline / Chats) on the right

# Messages Page Chat Hub Update

## Summary

The client portal **Messages** page now uses the same multi-location chat layout as the CRM **Client chat** tab on client account detail. Conversations are grouped on the left by context (All, Account, Tasks, Projects, Deals); the right panel shows the selected thread via `EntityActivityPanel`.

## Scope

- `apps/xtrawrkx-client-portal/src/app/(protected)/messages/page.jsx` — loads account tasks/projects and renders the hub
- `apps/xtrawrkx-client-portal/src/components/chat/PortalChatHub.jsx` — sidebar + chat panel UI (mirrors `ClientAccountChatHub`)
- `apps/xtrawrkx-client-portal/src/lib/api/portalChatAggregateService.js` — channel list, fetch/send, timeline per location

## Details

### Left sidebar sections

| Section | Source |
|---------|--------|
| **All** | Merged read-only view across all locations |
| **Account** | `chat-message` rows with empty `channelKey` (general support) |
| **Tasks** | Client-visible shared tasks → `/tasks/:id/client-comment` thread |
| **Projects** | Client-linked projects → `/projects/:id/client-comment` thread |
| **Deals** | Reserved (no portal deal API yet; section hidden when empty) |

### Removed from Messages page

- Four KPI feature cards (Real-time Chat, Team Access, etc.)
- Flat `ChatInterface` conversation list

The floating chat widget (`ChatProvider` / `FloatingChatWidget`) is unchanged.

## Usage

1. Open **Messages** in the client portal.
2. Choose a location under **Chat locations** on the left.
3. Read or reply in the chat panel on the right (composer disabled on **All messages** — pick a specific location to send).

## Migration

No backend changes required. Uses existing portal task/project comment APIs and `chat-message` account support channel.

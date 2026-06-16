# CRM Client Account — Unified Activities & Multi-Location Chat

## Summary

Client account detail in CRM now shows **one chronological activity timeline** across all linked records (account, lead company, deals, projects, tasks, contacts) and a **multi-channel client chat hub** with a left sidebar grouped by location (Account, Tasks, Projects, Deals).

## Scope

- `apps/crm/lib/api/clientAccountAggregateService.js` — merge timelines + per-channel chat fetch/send
- `apps/crm/components/ClientAccountChatHub.jsx` — sidebar channels + `EntityActivityPanel`
- `apps/crm/app/clients/accounts/[id]/page.js` — Activities tab unified timeline; Client chat tab uses hub
- `packages/ui/components/ActivitiesTimeline` — source badge (`Tasks · Task name`)
- `packages/ui/components/EntityActivityPanel` — source badge on chat messages in “All messages” view

## Activities tab

- `reloadCrmTimeline` calls `fetchUnifiedClientAccountTimeline` with linked deals, projects, tasks, and contacts.
- Rows are merged, deduped by id, sorted newest-first — **not grouped** by entity.
- Each row shows a small badge (`Section · Record name`) and an “Open record” link when applicable.

## Tasks tab

- CRM loads tasks via `GET /tasks/list-for-client-account` (not generic `GET /tasks?scope=crm`), including:
  - Tasks with `clientAccount` set (e.g. client-portal submissions)
  - Tasks on projects linked to the account
- Backend `task` controller now imports `task-scope` helpers (`mergeScopeFilter`, etc.) so CRM-scoped list queries no longer throw at runtime.

## Client chat tab

- Left sidebar lists channels: **All messages**, **Account**, each **Task**, **Project**, and **Deal** linked to the account.
- Task channels require tasks to load via `GET /tasks/list-for-client-account` (direct `clientAccount` link or tasks on the account's projects).
- Selecting a channel loads that thread; replies go to the correct backend (account unified chat, task/deal CRM comments, or project comments).
- **All messages** merges every channel chronologically; source badges show where each message lives. Composer is disabled on “All messages” — pick a specific channel to reply.

## Usage

No migration. Reload CRM after deploy. Linked records must be loaded on the account (existing tabs) for their activity/chat to appear in the aggregate views.

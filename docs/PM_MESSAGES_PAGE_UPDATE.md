# PM Messages Page — UI & Contacts Fallback

## Summary

The PM **`/message`** screen was restyled to match other PM surfaces (KPI row, elevated cards, inbox-style sidebar search) and **`fetchMessageContacts`** was added so the contact list uses **`GET /organizations/:id/users`** first, then the same **assignable-users fallback** as tasks (`GET /users`) when the org roster is empty — fixing empty lists for solo/small org setups where directory returned no rows.

## Scope

- **`apps/pm/app/message/page.js`** — layout, error states, **`?with=`** deep link, composer (**Enter** send, **Shift+Enter** newline), polling ~8s.
- **`apps/pm/lib/api/messageService.js`** — **`normalizeContactUser`**, **`fetchMessageContacts`**, **`fetchPmAssignableUsers`** normalizes `/users` rows.

## Usage

Open **`/message?with=<numericUserId>`** to pre-select a peer after contacts load.

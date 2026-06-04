# In-App Notifications (CRM + PM)

## Summary

End-to-end **in-app notifications** for users related to CRM and PM records. The bell in `WorkspaceHeader` (PM/CRM headers) polls `GET /api/notifications` every 30s. Events are created on the **Strapi backend** via `notification-emitter.js` so clients cannot spoof recipients.

## Scope

| Area | Files |
|------|--------|
| Schema | `apps/backend/src/api/notification/content-types/notification/schema.json` |
| Emitter | `apps/backend/src/utils/notification-emitter.js` |
| Triggers | `crm-activity` (comments), `task`, `project`, `deal`, `lead-company`, `contact`, `client-account`, `direct-message` controllers |
| UI | `packages/ui/components/WorkspaceHeader`, `packages/ui/utils/notificationDisplay.js`, PM `/inbox` |
| Clients | `apps/pm/lib/api/notificationService.js`, `apps/crm/lib/api/notificationService.js` |

## Who gets notified

| Event | Recipients |
|-------|------------|
| Task updated | Assignee, assigner, collaborators (not the actor) |
| Task assigned (create / assignee change) | New assignee |
| Project updated | Project manager, team members |
| Deal / lead / contact / client account updated | `assignedTo` user |
| Comment on task / project | Task assignee + collaborators; project PM + team; CRM `assignedTo` |
| @mention in comment or DM | Mentioned users — **urgent** (`type: mention`, `data.priority: urgent`) |
| Direct message | Recipient (+ extra mention targets if @used) |

The actor never receives their own notification.

## Mention format

Comments and DMs use the same token as the UI composer:

```text
@[Display Name](user:123)
```

Parsed server-side with the same regex as `packages/ui/utils/chatMentions.js`.

## Notification payload (`data` JSON)

| Field | Purpose |
|-------|---------|
| `subjectType` | `task`, `project`, `deal`, `lead_company`, `contact`, `client_account`, `direct_message` |
| `subjectId` | Entity id for deep links |
| `href` | In-app path, e.g. `/tasks/42`, `/sales/deals/7` |
| `app` | `pm` or `crm` (informational) |
| `priority` | `urgent` for @mentions |
| `actorId` | User who triggered the event |
| `changedKeys` | Fields changed on updates (optional) |

## API (unchanged routes)

- `GET /api/notifications` — current user + org
- `PUT /api/notifications/:id` — mark read
- `DELETE /api/notifications/:id` — delete own row

### Service helper (backend)

```js
await strapi.service('api::notification.notification').notify({
  userIds: [recipientId],
  organizationId: orgId,
  type: 'task_comment',
  title: 'New comment on My Task',
  message: 'Jane: "Please review…"',
  data: { subjectType: 'task', subjectId: 42, href: '/tasks/42', actorId: 1 },
});
```

Prefer `emitCommentNotifications` / `emitUpdateNotifications` from `notification-emitter.js` in controllers.

## UI behavior

- **Bell badge**: unread count; amber pulse dot when any unread urgent/mention exists.
- **Dropdown**: urgent rows use amber border, **Urgent** label, `AlertTriangle` icon; click marks read and navigates when `href` is set.
- **PM Inbox → Notifications**: same urgent styling and deep links.

## Usage / testing

1. Restart Strapi after schema enum changes (`mention`, `task_comment`, etc.).
2. As user A, assign a task to user B → B sees **task_assigned** in the bell.
3. As user C, comment on that task → A/B (stakeholders) see **task_comment**.
4. Comment with `@User` mention → mentioned user sees **mention** (urgent).
5. Send a DM → recipient sees **info** with link to `/message?withUser={senderId}`.

## Future (not in this pass)

- Email / push channels
- WebSocket live delivery (polling remains 30s)
- Per-user notification preferences

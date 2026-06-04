# Direct messages (PM) — backend & API

## Summary

PM **Messages** uses a Strapi collection type **`direct-message`** stored in table `direct_messages`, with REST routes under **`/api/direct-messages`**. Access is enforced in the controller using **`ctx.state.user`** (custom JWT from `global::jwt-auth`) and optional **`X-Organization-Id`** for tenant scoping.

## Scope

- **Backend:** `apps/backend/src/api/direct-message/`
- **PM app:** `apps/pm/lib/api/messageService.js`, `apps/pm/app/message/page.js`
- **Contacts list:** `GET /api/organizations/:id/users` (existing org controller)

## Data model

| Field          | Type        | Notes                                      |
|----------------|-------------|--------------------------------------------|
| `content`      | text        | Required                                   |
| `sender`       | relation    | `manyToOne` → `plugin::users-permissions.user` |
| `recipient`    | relation    | `manyToOne` → `plugin::users-permissions.user` |
| `organization` | relation  | Optional; set from `ctx.state.orgId` on create |

## REST API

### `GET /api/direct-messages?withUser=<numericId>`

Returns messages between the current user and `withUser`, oldest first.

- Requires `Authorization: Bearer <jwt>` (custom login JWT).
- If `X-Organization-Id` is sent, only messages for that organization are considered.

### `POST /api/direct-messages`

Body (Strapi v4-style wrapper):

```json
{
  "data": {
    "content": "Hello",
    "recipient": 5
  }
}
```

`sender` is always set server-side from `ctx.state.user.id`. You cannot message yourself.

### Update / delete

Not supported (`405`).

## Permissions

Bootstrap (`apps/backend/src/index.js`) attempts to create **find**, **findOne**, and **create** permissions on **Public** and **Authenticated** for `api::direct-message.direct-message`, because routes use `auth: false` and authorization is handled in the controller.

If calls return **403**, open **Strapi Admin → Settings → Users & Permissions → Roles** and enable the same actions for **Public** (and/or **Authenticated**).

## Local development

1. Restart Strapi so the new content type is registered and the DB table is created.
2. Ensure the PM app sends **`auth-token`** (or `strapi_token`) and **`current-org-id`** when using org-scoped messaging.
3. Run PM with `NEXT_PUBLIC_API_URL` pointing at the backend.

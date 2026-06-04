# SAAS Architecture Update – Multi-Tenant & Notifications

## Summary

Implemented the foundational SAAS improvements: **tenant (org) isolation on all CRM data**, **organization context in every API request**, **in-app notifications API**, **PostgreSQL migration path**, and a **shared org-aware auth context** across all apps.

---

## Scope

| Area | Files changed |
|---|---|
| Backend – lead-company | `schema.json`, `controllers/lead-company.js`, `routes/lead-company.js` |
| Backend – JWT middleware | `src/middlewares/jwt-auth.js` |
| Backend – notifications | `src/api/notification/*` (new) |
| Backend – config | `.env.example` |
| packages/auth | `AuthProvider.jsx`, `services/authService.js` |
| CRM client | `lib/strapiClient.js` |

---

## 1. Tenant Isolation (Organization Scoping)

### Problem
`lead_companies` had no organization FK. Any authenticated user could see all leads.

### What changed

**`lead-company/content-types/lead-company/schema.json`**
- Added `organization` → `manyToOne` relation to `api::organization.organization`.

**`lead-company/controllers/lead-company.js`**
- `find`: always filters by `ctx.state.orgId`; only returns leads for the caller's active org.
- `findOne`: returns 403 if the lead belongs to a different org.
- `create`: auto-sets `organization = ctx.state.orgId`; client cannot inject a different org.
- `update`: verifies ownership; strips any `organization` override from the payload.
- `delete`: verifies ownership before deleting.

### Rule going forward
**Every new content type that stores business data must add `organization` as a required manyToOne relation and use the same scoping pattern in its controller.**

---

## 2. Organization Context per Request

### How it works

```
CRM login  →  authService stores:
  auth-token          (JWT)
  auth-organizations  ([{ id, name, ... }])
  current-org-id      (e.g. "7")

Every strapiClient request adds:
  Authorization: Bearer <jwt>
  X-Organization-Id: 7

Backend jwt-auth middleware:
  1. Verifies JWT → sets ctx.state.user
  2. Reads X-Organization-Id header
  3. Validates user IS a member of that org (organization-user table)
  4. Sets ctx.state.orgId, ctx.state.orgRole, ctx.state.orgPermissions
  5. Fallback: if no header, auto-picks user's first org
```

**Key security property:** Even if a client sends a forged org id, the middleware checks `organization-user` and only sets `ctx.state.orgId` if the user is an active member. Controllers trust `ctx.state.orgId`, never client-supplied data.

### Org switcher
`useAuth()` now exposes:
- `organizations` – all orgs the user belongs to
- `currentOrg` – the currently active org object
- `switchOrg(orgId)` – switch active org (updates `current-org-id` in localStorage)

---

## 3. In-App Notifications API

### Schema (`api::notification.notification`)

| Field | Type | Notes |
|---|---|---|
| `type` | enum | `info`, `success`, `lead_created`, `deal_updated`, etc. |
| `title` | string | required |
| `message` | text | body text |
| `isRead` | boolean | default false |
| `readAt` | datetime | set on mark-as-read |
| `data` | json | extra payload (e.g. `{ leadId: 42 }`) |
| `user` | relation → user | recipient |
| `organization` | relation → org | tenant scoping |

### API routes
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | User's notifications (auto-filtered by user + org) |
| `PUT` | `/api/notifications/:id` | Mark as read / unread |
| `DELETE` | `/api/notifications/:id` | Delete own notification |
| `POST` | `/api/notifications` | Create notification (server-side; user+org auto-set) |

### Service helper
```js
// Use from other controllers/services to fire notifications:
await strapi.service('api::notification.notification').notify({
  userIds: [assignedUserId],
  organizationId: ctx.state.orgId,
  type: 'lead_created',
  title: 'New lead added',
  message: `${company.companyName} was added to your pipeline`,
  data: { leadId: company.id },
});
```

The CRM `notificationService.js` already polls `GET /api/notifications` every 30s — it will now receive real data.

---

## 4. PostgreSQL Migration Path

SQLite is the development default. To switch to PostgreSQL (required for production):

1. Install the driver inside `apps/backend`:
   ```bash
   npm install pg
   ```
2. Copy `.env.example` → `.env` (if not already done), uncomment the PostgreSQL section, and set:
   ```
   DATABASE_CLIENT=postgres
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=webfudge_platform
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_strong_password
   ```
3. Restart Strapi — it will create all tables in the new database.

> **Important:** Migrate early, before real data exists. Moving SQLite data to Postgres later is painful.

---

## 5. Auth Changes (shared `@webfudge/auth` package)

### `authService` new methods
| Method | Returns | Description |
|---|---|---|
| `getStoredOrganizations()` | `Array` | All orgs stored after login |
| `getCurrentOrgId()` | `number \| null` | Active org id from localStorage |
| `getCurrentOrg()` | `Object \| null` | Active org object |
| `setCurrentOrg(orgId)` | `boolean` | Switch org (validates membership) |

### `AuthProvider` / `useAuth()` new exports
| Key | Type | Description |
|---|---|---|
| `organizations` | `Array` | All user orgs |
| `currentOrg` | `Object \| null` | Active org |
| `switchOrg(orgId)` | `fn` | Switch org + re-render |

---

## What still needs to be done (future work)

| Area | Notes |
|---|---|
| **Org switcher UI** | Add an org picker in `CRMSidebar` or header using `useAuth().switchOrg` |
| **More content types** | Apply same org-scoping pattern to contacts, deals, tasks, projects |
| **RBAC enforcement** | Use `ctx.state.orgRole` + `ctx.state.orgPermissions` in controllers |
| **PostgreSQL** | Switch to Postgres before going to production |
| **httpOnly cookies** | Move JWT from localStorage to httpOnly cookies for XSS safety |
| **Notifications on events** | Fire `notify()` in lead-company.create, deal.update, task.assign, etc. |

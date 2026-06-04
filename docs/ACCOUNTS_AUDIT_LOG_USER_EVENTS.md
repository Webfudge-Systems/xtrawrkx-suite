# Accounts Audit Log — User & Invite Events

## Summary

The Accounts **Audit Logs** page reads from the shared `crm-activities` feed (`GET /crm-activities/feed`). Previously, only CRM and PM mutations wrote to that store, so **adding, inviting, or updating organization users produced no audit rows**.

Backend now writes **Accounts** events to the same feed when users are managed from the organization APIs.

## Scope

- `apps/backend/src/utils/crm-activity-log.js` — `logAccountsActivity`, `actorDisplayName`
- `apps/backend/src/api/invitation/services/invitation.js` — direct add, invite, accept
- `apps/backend/src/api/organization/controllers/organization.js` — membership updates
- `apps/accounts/app/audit-logs/page.js` — labels/module/category for `organization_user` and `invitation`

## Events recorded

| Flow | `subjectType` | `action` | Example summary |
|------|---------------|----------|-----------------|
| Direct add (Users page) | `organization_user` | `create` / `update` | "Jane added user@co.com to the organization as Member" |
| Email invite | `invitation` | `create` | "Jane invited user@co.com as Member" |
| Invite accepted | `organization_user` + `invitation` | `create` / `update` | Join + invitation accepted |
| Role / suspend / activate | `organization_user` | `update` | "Jane updated user@co.com (Role, Status)" |

## Usage

1. Restart the Strapi backend (`npm run dev:backend` or your deploy process).
2. Add or invite a user from **Accounts → Users**.
3. Open **Audit Logs** and refresh — events appear under module **ACCOUNTS**, type **User & role changes**.

Historical user changes before this update are **not** backfilled.

## Migration

No schema migration. Uses existing `crm-activity` content type with new `subjectType` values: `organization_user`, `invitation`.

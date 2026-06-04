# Backend content API controllers (org-scoped CRM resources)

## Summary

Strapi **content API** handlers for CRM entities share the same conventions: JWT + `X-Organization-Id` (see `global::jwt-auth`), **`find` / `findOne` / `create` / `update` / `delete`** scoped by `organization`, list pagination/sort helpers, and **populate allowlists** (avoids Strapi 5 errors from unknown relations).

## Shared helpers

`apps/backend/src/utils/content-api-helpers.js`

- **`orgIdFromRelation(rel)`** — normalize relation → numeric org id for ACL checks.
- **`readListQuery(ctx, opts?)`** — `page`, `pageSize`, `sort`, raw `query` (supports `pagination[page]` / `pagination[pageSize]` / `sort`).
- **`createPopulateSanitizer(allowedKeys, fallbackPopulate)`** — returns `sanitizePopulate()` used in `find` / `findOne`.
- **`safeCount(strapi, uid, where, fallbackTotal)`** — pagination total with DB count fallback.

## Resources using this pattern

| API | Controller | Routes |
|-----|------------|--------|
| Client account | `api/client-account/controllers/client-account.js` | `routes/client-account.js` |
| Contact | `api/contact/controllers/contact.js` | `routes/contact.js` |
| Lead company | `api/lead-company/controllers/lead-company.js` | `routes/lead-company.js` |
| Deal | `api/deal/controllers/deal.js` | `routes/deal.js` + `routes/custom-deal.js` |
| Task | `api/task/controllers/task.js` | `routes/task.js` + `routes/custom-task.js` (`my-work`) |
| Project | `api/project/controllers/project.js` | `routes/project.js` |

Custom actions stay in separate route files (`convert`, `delivery-project`, `my-work`) with the same `auth: false` + middleware pattern as CRUD routes.

## Task & project note

Tasks and projects previously relied on the default **`createCoreRouter`** only (no org enforcement on list/detail). They now use **explicit routes** and the same tenancy checks as deals/contacts, with list **`maxPageSize` 500** where the CRM loads larger pages.

## Populate: `deliveryProject` on deals

`deal` list/detail allowlists include **`deliveryProject`** so CRM pipeline/detail queries can populate the linked project without 500s.

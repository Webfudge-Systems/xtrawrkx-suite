# Backend: CORS and lead-companies org context

## Summary

Browsers blocked CRM requests to Strapi because the `X-Organization-Id` header was not listed in CORS `Access-Control-Allow-Headers`. That header is required so `global::jwt-auth` can set `ctx.state.orgId` for multi-tenant APIs (lead-companies, notifications, etc.).

Lead-company handlers were also tightened so list/read/update/delete never run without an active organization, and organization checks work whether Strapi returns the relation as an object or a plain id.

## Scope

- `apps/backend/config/middlewares.js` – CORS `headers` includes `X-Organization-Id`
- `apps/backend/src/api/lead-company/controllers/lead-company.js` – require `ctx.state.orgId` for `find` / `findOne`; normalize relation id for access checks

## Usage

No client changes required if the CRM already sends `X-Organization-Id` (via `strapiClient` and `current-org-id` in localStorage). Restart the Strapi server after deploying the middleware change.

## Migration

None. Existing tenants keep behavior; users without an active org now receive 403 instead of ambiguous or cross-tenant list results.

## Follow-up: lead-company populate (500 on detail)

`GET /api/lead-companies/:id` returned **500** when the client requested `populate` for `contacts` or `deals`, because those relations are not defined on the lead-company content type. The CRM `getOne` / list calls now only request `assignedTo` and `organization`, and the controller **sanitizes** populate to that whitelist so stray query params cannot crash Strapi.

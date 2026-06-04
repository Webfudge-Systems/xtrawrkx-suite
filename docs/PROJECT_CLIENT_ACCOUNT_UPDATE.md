# Project client relation — client accounts (not lead companies)

## Summary

PM projects link to **client accounts** (`api::client-account.client-account`), not lead companies. The project schema, client picker API, and PM copy were aligned so create/edit/detail flows list converted CRM accounts.

## Scope

- `apps/backend/src/api/project/content-types/project/schema.json` — `clientAccount` target
- `apps/backend/src/api/project/controllers/project.js` — `GET /projects/client-options`, org validation on create/update
- `apps/backend/types/generated/contentTypes.d.ts` — generated `Project` type
- `apps/pm/lib/api/projectService.js` — populate fields + comment
- `apps/pm/app/projects/add/page.js`, `apps/pm/app/projects/[slug]/edit/page.js` — empty-state hint
- `apps/pm/lib/api/projectClientOptions.js` — comment

PM create/edit already sent `clientAccount` in the payload; only the data source and schema target were wrong.

## Details

### Before

- `project.clientAccount` pointed at `api::lead-company.lead-company`.
- `GET /projects/client-options` returned org lead companies for the Client dropdown.

### After

- `project.clientAccount` points at `api::client-account.client-account`.
- `GET /projects/client-options` returns org client accounts (`companyName`, `status`), sorted by name.
- Create/update reject `clientAccount` IDs outside the active organization.

## Usage / migration

1. **Restart Strapi** after pulling so the schema change is applied (Strapi may alter the FK column on `projects`).
2. **Re-link existing projects** if any were tied to lead company IDs under the old relation — those IDs will not match client account rows. Open each project in PM and pick the correct client account (or leave empty).
3. Client accounts are managed in CRM under **Clients → Accounts** (including conversion from a lead company).

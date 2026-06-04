# CRM activities timeline

## Summary

The backend now stores **CRM activity** rows whenever contacts or lead companies are created, updated, or deleted through the custom Strapi controllers. The CRM app loads these rows into an **activity timeline** on lead company and contact detail pages (Activities tab), and uses the same feed for **total activity count** and **last activity** on the overview sidebar where applicable.

**Organization-wide feed:** `GET /api/crm-activities/feed?limit=&start=` returns activities for the active org (`limit` up to 100, `start` offset for pagination). Used by the CRM sidebar and the full **Activity log** page at `/activities` (`apps/crm/app/activities/page.js`). See [CRM_SIDEBAR_NAV_REFACTOR.md](./CRM_SIDEBAR_NAV_REFACTOR.md).

## Scope

- **Backend (`apps/backend`)**
  - New content type: `api::crm-activity.crm-activity` (REST collection `crm-activities`).
  - `src/utils/crm-activity-log.js` — builds human-readable summaries and writes activity rows (best-effort; failures do not block the main mutation). On **update**, compares `previousEntity` to the request **patch** and stores `meta.changes` as `{ key, label, before, after }[]` for the timeline UI.
  - `contact` and `lead-company` controllers call the logger after successful create / update / delete.
  - `GET /api/crm-activities/timeline` — scoped timeline with org + record checks:
    - `?contactId=<id>` — events for that contact only.
    - `?leadCompanyId=<id>` — events for that lead (its own changes) **and** linked contacts (via `leadCompany` on the activity row).
- **CRM (`apps/crm`)**
  - `lib/api/crmActivityService.js` — fetches the timeline.
  - `@webfudge/ui` `ActivitiesTimeline` — vertical timeline UI.
  - `app/sales/lead-companies/[id]/page.js` and `app/sales/contacts/[id]/page.js` — data loading, KPIs, Activities tab, silent refresh after inline saves.

## Data model (high level)

| Field           | Purpose |
|----------------|---------|
| `organization` | Tenant (matches `ctx.state.orgId`). |
| `actor`        | `users-permissions` user when the CRM JWT middleware set `ctx.state.user`. |
| `action`       | `create` \| `update` \| `delete`. |
| `subjectType`  | `contact` \| `lead_company` (extend for more modules later). |
| `subjectId`    | Numeric entity id (same id used in CRM URLs / Strapi `findOne`). |
| `leadCompany`  | Optional link to a lead company: set for contact rows (when linked) and for lead rows (self), so the lead timeline can query in one filter. |
| `summary`      | Short description shown in the UI. |
| `meta`         | Optional JSON: `changedFields`, and on updates with diffs `changes[]` with `before` / `after` display strings per field. |

## Extending to other modules

1. Add a stable `subjectType` string (e.g. `deal`).
2. After mutations in that API’s controller, call `logCrmActivity` with the same shape. For updates, pass `previousEntity` (pre-update row, with relations populated if you want friendly labels) and `patch` (request body data) so `meta.changes` can be built (ensure `leadCompany` is set when events should appear on a lead timeline).
3. Extend `buildSummary` / field labels in `crm-activity-log.js`.
4. Add timeline query params or filters in `crm-activity` controller as needed, and call them from the CRM.

## Usage / operations

- Run or restart Strapi so the new content type is registered and the DB table is created (e.g. `crm_activities` on SQLite).
- If the Strapi **Users & Permissions** plugin blocks the new route in your environment, allow `find`/`timeline` for the **Authenticated** role as you do for other custom CRM routes (this project often uses `auth: false` on routes and relies on JWT + org middleware in controllers).

## API

`GET /api/crm-activities/timeline?leadCompanyId=5&limit=50`  
`GET /api/crm-activities/timeline?contactId=12&limit=50`

Response: `{ data: [...], meta: { total } }` — `data` sorted by `createdAt` descending; entries may include populated `actor`.

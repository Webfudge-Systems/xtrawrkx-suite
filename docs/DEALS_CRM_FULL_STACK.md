# CRM Deals — Full Stack Update

## Summary

Deals are now backed by a real Strapi `deal` collection type with org-scoped REST routes (same tenancy pattern as contacts). The CRM list, pipeline, detail, add, and edit experiences use `@webfudge/ui` (`FormSectionCard`, `Table`, `KPICard`, `TabsWithActions`, `CRMPageHeader` via `WorkspaceHeader`, etc.) and align with other sales pages.

## Scope

- **Backend:** `apps/backend/src/api/deal/` (schema, controller, routes, service)
- **CRM:** `apps/crm/app/sales/deals/**`, `apps/crm/lib/api/dealService.js`, `apps/crm/lib/dealFormOptions.js`
- **Activity log:** `apps/backend/src/utils/crm-activity-log.js` — `subjectType: 'deal'` summaries and field labels

## Deal schema (high level)

- Core: `name`, `value`, `stage` (discovery → lost), `priority`, `probability`, `visibility`, `dealGroup`, `expectedCloseDate`, `source`, `description`, `notes`
- Relations: `organization`, `assignedTo`, `leadCompany`, `clientAccount`, `contact`

## API

- `GET/POST /api/deals`, `GET/PUT/DELETE /api/deals/:id` — JWT + `X-Organization-Id` (custom middleware, same as contacts)

## CRM client

- `dealService` mirrors `contactService` (normalize Strapi entries, `populate`, relation `{ id }` shape for writes).
- **Activities tab** on deal detail loads the existing `/crm-activities/timeline` when a **lead company** is linked (company-scoped activity), so deals without a lead show an explanatory message instead.
- **Deals list table** supports column show/hide + drag reorder (`localStorage`), inline **stage** updates, row **actions** (more menu, view, edit, delete), and **deal-scoped comments** via `crmActivityService.fetchDealComments` / `addDealComment` / `fetchDealCommentCounts` (backend: `dealId` on timeline + comments, `dealIds` on comment-counts).

## After pulling

1. Restart Strapi so the new content type registers.
2. In Strapi Admin → Settings → Users & Permissions → Authenticated (or your CRM role), enable `deal` **find**, **findOne**, **create**, **update**, **delete** if permissions are not auto-granted in your environment.
